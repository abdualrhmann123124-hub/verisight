"""Behavioural tests for the analysis pipeline.

These exist because the spectral analyzer shipped an inverted discriminator
once already: its original rule scored `max(residual) / std(residual)`, which
*falls* as periodic structure strengthens. It called a genuine 8x upsampling
grid "authentic" and a smooth gradient "synthetic" at full strength, and
nothing caught it until the fixtures below were run by hand.

The fixtures are synthesised with known properties rather than sampled from
real media, so these tests assert *direction and ordering*, not absolute
thresholds. They are a regression guard, not a validation of accuracy — that
still requires a labelled corpus, which is why `calibrated` remains False.
"""

from __future__ import annotations

import io

import numpy as np
import pytest
from PIL import Image

from app.schemas.analysis import Direction, Verdict
from app.services.pipeline import (
    MediaTooLargeError,
    UnsupportedMediaError,
    analyze_bytes,
)

SIZE = 768


def _base_field() -> np.ndarray:
    """Smooth, photograph-like luminance content."""
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    field = 0.25 + 0.5 * np.sin(xx / 90.0) * np.cos(yy / 110.0) * 0.5 + yy / (2.2 * SIZE)
    return np.clip(field, 0.02, 0.98)


def _encode(array: np.ndarray, fmt: str, **kwargs: object) -> bytes:
    buffer = io.BytesIO()
    Image.fromarray((array * 255).astype(np.uint8)).convert("RGB").save(
        buffer, fmt, **kwargs
    )
    return buffer.getvalue()


@pytest.fixture(scope="module")
def photo_like() -> bytes:
    """Shot noise scaled by sqrt(signal) — the brightness dependence a real
    sensor produces — then JPEG encoded with standard tables."""
    rng = np.random.default_rng(42)
    base = _base_field()
    noise = rng.normal(0, 1, (SIZE, SIZE)) * np.sqrt(base) * 0.035
    return _encode(np.clip(base + noise, 0, 1), "JPEG", quality=92)


@pytest.fixture(scope="module")
def upsampled() -> bytes:
    """An explicit 8x nearest-neighbour upsampling grid — the exact artefact
    the spectral analyzer exists to find."""
    rng = np.random.default_rng(7)
    small = rng.random((SIZE // 8, SIZE // 8))
    grid = np.kron(small, np.ones((8, 8)))
    return _encode(np.clip(grid * 0.25 + _base_field() * 0.75, 0, 1), "PNG")


@pytest.fixture(scope="module")
def flat_clean() -> bytes:
    """Smooth gradient with no noise at all."""
    return _encode(_base_field(), "PNG")


class TestSpectralDirection:
    def test_upsampling_grid_reads_synthetic(self, upsampled: bytes) -> None:
        """The regression that motivated this file."""
        result = analyze_bytes(upsampled, "upsampled.png")
        spectral = next(f for f in result.assessment.findings if f.id == "spectral")
        assert spectral.direction is Direction.SYNTHETIC
        assert spectral.measurements["residual_std"] > 0.25

    def test_smooth_content_does_not_read_synthetic(self, flat_clean: bytes) -> None:
        """A smooth spectrum must not be mistaken for periodic structure."""
        result = analyze_bytes(flat_clean, "flat.png")
        spectral = next(f for f in result.assessment.findings if f.id == "spectral")
        assert spectral.direction is not Direction.SYNTHETIC

    def test_strength_is_capped(self, upsampled: bytes) -> None:
        """No single unvalidated heuristic may reach full strength."""
        result = analyze_bytes(upsampled, "upsampled.png")
        spectral = next(f for f in result.assessment.findings if f.id == "spectral")
        assert spectral.strength <= 0.7


class TestNoise:
    def test_brightness_dependent_noise_reads_authentic(self, photo_like: bytes) -> None:
        result = analyze_bytes(photo_like, "photo.jpg")
        noise = next(f for f in result.assessment.findings if f.id == "noise")
        assert noise.direction is Direction.AUTHENTIC

    def test_absent_noise_reads_synthetic(self, flat_clean: bytes) -> None:
        result = analyze_bytes(flat_clean, "flat.png")
        noise = next(f for f in result.assessment.findings if f.id == "noise")
        assert noise.direction is Direction.SYNTHETIC


class TestJpegOnlyAnalyzers:
    def test_jpeg_runs_compression_analyzers(self, photo_like: bytes) -> None:
        """Regression: `exif_transpose` returns a new image with no `format`
        and no quantization tables, which silently disabled both of these on
        every JPEG."""
        ids = {f.id for f in analyze_bytes(photo_like, "photo.jpg").assessment.findings}
        assert "quantization" in ids
        assert "ela" in ids

    def test_png_abstains_from_compression_analyzers(self, flat_clean: bytes) -> None:
        """Abstaining is correct, and is why evidence_strength drops for PNG."""
        ids = {f.id for f in analyze_bytes(flat_clean, "flat.png").assessment.findings}
        assert "quantization" not in ids
        assert "ela" not in ids


class TestAggregation:
    def test_score_ordering(
        self, photo_like: bytes, upsampled: bytes
    ) -> None:
        """The photograph-like fixture must score lower (more authentic) than
        the one carrying an upsampling grid."""
        photo = analyze_bytes(photo_like, "photo.jpg").assessment
        synth = analyze_bytes(upsampled, "upsampled.png").assessment
        assert photo.synthetic_likelihood < synth.synthetic_likelihood

    def test_thin_evidence_stays_inconclusive(self, upsampled: bytes) -> None:
        """A high score on weak evidence must not become a confident verdict.

        This fixture scores ~89 with ~22% evidence; the widened margin must
        keep it inconclusive rather than reporting "likely synthetic".
        """
        assessment = analyze_bytes(upsampled, "upsampled.png").assessment
        assert assessment.evidence_strength < 50
        assert assessment.verdict is Verdict.INCONCLUSIVE

    def test_never_claims_calibration(self, photo_like: bytes) -> None:
        """Guards the central honesty constraint: the composite is a weighted
        heuristic, and must not be presented as a calibrated probability."""
        assert analyze_bytes(photo_like, "photo.jpg").assessment.calibrated is False

    def test_limitations_always_present(self, photo_like: bytes) -> None:
        assert analyze_bytes(photo_like, "photo.jpg").assessment.limitations


class TestInputHandling:
    def test_corrupt_bytes_rejected(self) -> None:
        with pytest.raises(UnsupportedMediaError):
            analyze_bytes(b"this is not an image", "fake.png")

    def test_truncated_image_rejected(self, flat_clean: bytes) -> None:
        with pytest.raises(UnsupportedMediaError):
            analyze_bytes(flat_clean[:20], "truncated.png")

    def test_oversized_input_rejected(self) -> None:
        with pytest.raises(MediaTooLargeError):
            analyze_bytes(b"\x00" * (26 * 1024 * 1024), "huge.png")

    def test_hash_is_of_original_bytes(self, photo_like: bytes) -> None:
        import hashlib

        result = analyze_bytes(photo_like, "photo.jpg")
        assert result.sha256 == hashlib.sha256(photo_like).hexdigest()
