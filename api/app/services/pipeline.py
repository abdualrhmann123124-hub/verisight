"""Analysis orchestration.

Prepares the shared inputs once, runs every analyzer, and hands the findings
to the aggregator. Routes call this; they contain no analysis logic.
"""

from __future__ import annotations

import hashlib
import io
import logging
import time

import numpy as np
from PIL import Image, ImageOps

from app.analyzers.base import AnalysisInput
from app.analyzers.compression import ErrorLevelAnalyzer, QuantizationAnalyzer
from app.analyzers.metadata import MetadataAnalyzer
from app.analyzers.signal import NoiseAnalyzer, SpectralAnalyzer
from app.core.config import settings
from app.schemas.analysis import AnalysisResponse, Finding
from app.services.aggregate import aggregate

logger = logging.getLogger(__name__)

ENGINE_VERSION = "0.1.0"

#: Order is presentational only — the aggregator weights by analyzer id.
ANALYZERS = (
    MetadataAnalyzer(),
    QuantizationAnalyzer(),
    ErrorLevelAnalyzer(),
    SpectralAnalyzer(),
    NoiseAnalyzer(),
)


class UnsupportedMediaError(ValueError):
    """The bytes could not be decoded as a supported image."""


class MediaTooLargeError(ValueError):
    """The file or its decoded pixel count exceeds the configured limit."""


def _prepare(raw: bytes, filename: str) -> AnalysisInput:
    if len(raw) > settings.max_upload_bytes:
        raise MediaTooLargeError(
            f"File is {len(raw) / 1_048_576:.1f} MB; the limit is "
            f"{settings.max_upload_bytes / 1_048_576:.0f} MB."
        )

    try:
        image = Image.open(io.BytesIO(raw))
        # Decoders are lazy; force it now so corrupt data fails here rather
        # than midway through an analyzer.
        image.load()
    except Exception as exc:  # Pillow raises a wide range of errors
        raise UnsupportedMediaError(
            "This file could not be decoded as an image."
        ) from exc

    if image.width * image.height > settings.max_pixels:
        raise MediaTooLargeError(
            f"Image is {image.width}x{image.height}; the limit is "
            f"{settings.max_pixels // 1_000_000} megapixels."
        )

    # Capture container facts *before* any transform. `exif_transpose` returns
    # a new Image whose `format` is None and which carries no `quantization`
    # tables — reading them afterwards silently disabled the compression and
    # ELA analyzers on every JPEG, losing two of five signals without error.
    source_format = (image.format or "unknown").lower()
    qtables = getattr(image, "quantization", None)
    media_type = f"image/{source_format}"

    # Respect EXIF orientation so analyzers see the image as displayed.
    image = ImageOps.exif_transpose(image) or image
    # Re-attach what the transform dropped.
    if qtables:
        image.quantization = qtables  # type: ignore[attr-defined]

    # Downscale once for the pixel-statistics analyzers. The artefacts they
    # look for are structural and survive this; runtime does not.
    working = image.convert("L")
    long_edge = max(working.size)
    if long_edge > settings.analysis_long_edge:
        scale = settings.analysis_long_edge / long_edge
        working = working.resize(
            (max(1, int(working.width * scale)), max(1, int(working.height * scale))),
            Image.Resampling.LANCZOS,
        )

    gray = np.asarray(working, dtype=np.float64) / 255.0

    return AnalysisInput(
        raw=raw,
        filename=filename,
        media_type=media_type,
        image=image,
        gray=gray,
        width=image.width,
        height=image.height,
    )


def analyze_bytes(raw: bytes, filename: str) -> AnalysisResponse:
    started = time.perf_counter()
    data = _prepare(raw, filename)

    findings: list[Finding] = []
    for analyzer in ANALYZERS:
        try:
            result = analyzer.run(data)
        except Exception:
            # One analyzer failing must not lose the others' evidence. Log it
            # and continue — a partial assessment with honest evidence
            # weighting beats a 500 that discards four good measurements.
            logger.exception("analyzer %s failed on %s", analyzer.id, filename)
            continue
        if result is not None:
            findings.append(result)

    assessment = aggregate(findings)

    return AnalysisResponse(
        filename=filename,
        media_type=data.media_type,
        width=data.width,
        height=data.height,
        sha256=hashlib.sha256(raw).hexdigest(),
        processing_ms=int((time.perf_counter() - started) * 1000),
        assessment=assessment,
        engine_version=ENGINE_VERSION,
    )
