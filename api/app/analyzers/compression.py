"""Compression forensics: quantization tables and Error Level Analysis."""

from __future__ import annotations

import io

import numpy as np
from PIL import Image

from app.analyzers.base import AnalysisInput, clamp01
from app.schemas.analysis import Direction, Finding

#: The luminance table the IJG/libjpeg reference encoder emits at quality 50.
#: Camera firmware and most editors scale this baseline; encoders that build
#: tables from scratch tend not to match its shape.
IJG_LUMA_Q50 = np.array(
    [
        [16, 11, 10, 16, 24, 40, 51, 61],
        [12, 12, 14, 19, 26, 58, 60, 55],
        [14, 13, 16, 24, 40, 57, 69, 56],
        [14, 17, 22, 29, 51, 87, 80, 62],
        [18, 22, 37, 56, 68, 109, 103, 77],
        [24, 35, 55, 64, 81, 104, 113, 92],
        [49, 64, 78, 87, 103, 121, 120, 101],
        [72, 92, 95, 98, 112, 100, 103, 99],
    ],
    dtype=np.float64,
)


class QuantizationAnalyzer:
    """Fingerprints the JPEG encoder from its quantization tables.

    Cameras use a small set of firmware tables. Editors and generative
    pipelines typically re-encode with library defaults. Comparing the table's
    shape against the IJG baseline distinguishes "came out of a camera" from
    "was written by a software encoder" reasonably well.

    Abstains on anything that is not JPEG, which is most generated output —
    absence of a result here is itself informative to the aggregator.
    """

    id = "quantization"
    label = "Compression fingerprint"

    def run(self, data: AnalysisInput) -> Finding | None:
        qtables = getattr(data.image, "quantization", None)
        if not qtables:
            return None  # not a JPEG, or tables unavailable

        table = np.array(qtables[0], dtype=np.float64)
        if table.size != 64:
            return None
        table = table.reshape(8, 8)

        # Scale-invariant comparison: encoders scale the same baseline for
        # different quality settings, so the *shape* is the fingerprint, not
        # the magnitude.
        baseline = IJG_LUMA_Q50 / IJG_LUMA_Q50.sum()
        observed = table / max(table.sum(), 1e-9)
        shape_divergence = float(np.abs(observed - baseline).sum())

        # DC coefficient approximates overall quality: low means light
        # compression, high means the file has been squeezed hard.
        dc = float(table[0, 0])
        measurements = {
            "dc_coefficient": dc,
            "table_sum": float(table.sum()),
            "shape_divergence_from_ijg": round(shape_divergence, 4),
            "table_count": len(qtables),
        }

        # Threshold chosen from the divergence range observed across camera
        # JPEGs versus library-encoded output. It separates the two families
        # but is not a calibrated decision boundary.
        if shape_divergence > 0.35:
            return Finding(
                id=self.id,
                label=self.label,
                direction=Direction.NEUTRAL,
                strength=clamp01(shape_divergence),
                code="quantization.nonstandard",
                summary=(
                    "The quantization table does not match the standard encoder "
                    "baseline, indicating the file was re-encoded by software."
                ),
                measurements=measurements,
                caveat=(
                    "Re-encoding happens whenever an image is edited, resized, or "
                    "uploaded to a platform. It does not indicate fabrication."
                ),
            )

        return Finding(
            id=self.id,
            label=self.label,
            direction=Direction.AUTHENTIC,
            strength=0.35,
            code="quantization.standard",
            summary=(
                "The quantization table follows the standard encoder baseline, "
                "consistent with a camera or a conventional export."
            ),
            measurements=measurements,
            caveat="Common encoders are easy to imitate; this is supporting evidence only.",
        )


class ErrorLevelAnalyzer:
    """Error Level Analysis: re-encode and measure where the error concentrates.

    A JPEG that has been saved once compresses uniformly. Regions pasted in
    from a differently-compressed source sit at a different error level and
    show up as bright patches.

    ELA is widely misapplied — it is genuinely noisy, and texture alone
    produces bright regions with no manipulation involved. It is included here
    for its *spatial inconsistency* signal, weighted low, with an explicit
    caveat rather than presented as a manipulation detector.
    """

    id = "ela"
    label = "Error level analysis"

    def run(self, data: AnalysisInput) -> Finding | None:
        if "jpeg" not in data.media_type.lower():
            return None  # meaningless on a format that was never JPEG-compressed

        rgb = data.image.convert("RGB")
        buffer = io.BytesIO()
        rgb.save(buffer, "JPEG", quality=90)
        buffer.seek(0)
        resaved = Image.open(buffer).convert("RGB")

        original = np.asarray(rgb, dtype=np.int16)
        again = np.asarray(resaved, dtype=np.int16)
        residual = np.abs(original - again).max(axis=2).astype(np.float64)

        if residual.size == 0:
            return None

        # Block-wise statistics: a single global mean says nothing about
        # whether the error is evenly spread, which is the actual signal.
        block = 32
        h, w = residual.shape
        bh, bw = h // block, w // block
        if bh < 2 or bw < 2:
            return None

        trimmed = residual[: bh * block, : bw * block]
        blocks = trimmed.reshape(bh, block, bw, block).mean(axis=(1, 3))

        mean = float(blocks.mean())
        std = float(blocks.std())
        # Coefficient of variation: how unevenly the error is distributed,
        # normalised so it does not simply track overall compression level.
        cv = std / mean if mean > 1e-6 else 0.0

        measurements = {
            "mean_error": round(mean, 3),
            "block_std": round(std, 3),
            "coefficient_of_variation": round(cv, 3),
            "blocks_sampled": int(bh * bw),
        }

        if cv > 1.2:
            return Finding(
                id=self.id,
                label=self.label,
                direction=Direction.NEUTRAL,
                strength=clamp01((cv - 1.2) / 1.5),
                code="ela.uneven",
                summary=(
                    "Compression error is unevenly distributed across the frame, "
                    "which can indicate regions from different sources."
                ),
                measurements=measurements,
                caveat=(
                    "Highly textured or high-contrast areas produce the same pattern "
                    "without any editing. Treat as a prompt to look closer, not a finding."
                ),
            )

        return Finding(
            id=self.id,
            label=self.label,
            direction=Direction.NEUTRAL,
            strength=0.2,
            code="ela.even",
            summary="Compression error is spread evenly, with no obvious spliced regions.",
            measurements=measurements,
            caveat=(
                "Uniform error is expected after any full re-encode, including one "
                "applied to a composite."
            ),
        )
