"""Signal-domain forensics: spectral artefacts and sensor noise."""

from __future__ import annotations

import numpy as np

from app.analyzers.base import AnalysisInput, clamp01
from app.schemas.analysis import Direction, Finding


class SpectralAnalyzer:
    """Looks for periodic artefacts left by generative upsampling.

    GAN and diffusion decoders build images through repeated upsampling.
    Transposed convolution and nearest-neighbour upsampling both impose a
    periodic structure that is invisible spatially but shows as regularly
    spaced peaks in the frequency domain — the "checkerboard" artefact
    documented in the up-convolution literature.

    Method: FFT of the grayscale image, radially averaged into a 1-D power
    spectrum. Natural images fall off smoothly and approximately as a power
    law; synthetic upsampling superimposes periodic spikes and often an
    elevated high-frequency tail.

    Heavy JPEG compression destroys exactly this evidence, so the analyzer
    reports low strength when the spectrum looks compression-limited.
    """

    id = "spectral"
    label = "Frequency domain"

    def run(self, data: AnalysisInput) -> Finding | None:
        gray = data.gray
        if gray.shape[0] < 128 or gray.shape[1] < 128:
            return None  # too small for the spectrum to be meaningful

        # Window the image before the transform. Without it, the discontinuity
        # between opposite edges produces a cross artefact that would be
        # mistaken for a periodic signal.
        h, w = gray.shape
        window = np.outer(np.hanning(h), np.hanning(w))
        spectrum = np.fft.fftshift(np.abs(np.fft.fft2(gray * window)))
        power = np.log1p(spectrum)

        cy, cx = h // 2, w // 2
        y, x = np.ogrid[:h, :w]
        radius = np.sqrt((y - cy) ** 2 + (x - cx) ** 2).astype(np.int32)
        max_r = min(cy, cx)
        if max_r < 32:
            return None

        # Radial average: rotationally-invariant 1-D profile of the spectrum.
        radial = np.bincount(radius.ravel(), power.ravel(), minlength=max_r + 1)
        counts = np.bincount(radius.ravel(), minlength=max_r + 1)
        profile = (radial[:max_r] / np.maximum(counts[:max_r], 1))[8:]

        if profile.size < 32:
            return None

        # Detrend so the natural power-law falloff does not register as
        # structure; what remains is the deviation from a smooth spectrum.
        idx = np.arange(profile.size, dtype=np.float64)
        slope, intercept = np.polyfit(idx, profile, 1)
        residual = profile - (slope * idx + intercept)

        # Primary discriminator: how far the profile departs from a smooth
        # power-law falloff. Periodic upsampling raises this substantially —
        # measured at ~0.57 on an image with an 8x nearest-neighbour grid
        # versus ~0.04 for smooth content.
        residual_std = float(residual.std())

        # Reported but NOT used as a decision rule. This ratio was originally
        # the trigger and it is backwards: many strong periodic peaks inflate
        # the denominator and *suppress* the score, while a single numerical
        # blip in an otherwise flat spectrum maximises it. Testing had it
        # calling a genuine upsampling grid "authentic" and a smooth gradient
        # "synthetic" at full strength. Kept as a diagnostic only.
        peakiness = (
            float(np.abs(residual).max() / residual_std) if residual_std > 1e-9 else 0.0
        )

        # Energy in the top third of the spectrum, relative to the whole.
        # Aggressive compression flattens this; generated images often retain
        # more than a comparable photograph.
        high_band = float(profile[int(profile.size * 0.66) :].mean())
        overall = float(profile.mean())
        high_ratio = high_band / overall if abs(overall) > 1e-9 else 0.0

        measurements = {
            "spectral_slope": round(float(slope), 5),
            "residual_std": round(residual_std, 4),
            "peakiness": round(peakiness, 3),
            "high_frequency_ratio": round(high_ratio, 4),
            "profile_length": int(profile.size),
        }

        # Thresholds below are provisional. They were chosen to separate the
        # cases available during development, which is a handful of
        # constructed fixtures — not a labelled corpus. Strength is capped
        # well under 1.0 so this signal cannot dominate the aggregate on its
        # own, and `Assessment.calibrated` stays False because of exactly
        # this kind of unvalidated boundary.
        if residual_std > 0.25:
            return Finding(
                id=self.id,
                label=self.label,
                direction=Direction.SYNTHETIC,
                strength=clamp01((residual_std - 0.25) / 0.5) * 0.7,
                code="spectral.periodic",
                summary=(
                    "The frequency spectrum departs sharply from a natural falloff, "
                    "consistent with the periodic structure generative upsampling leaves."
                ),
                measurements=measurements,
                caveat=(
                    "Repetitive real-world texture — fabric, brickwork, screens, "
                    "halftone print — produces similar structure."
                ),
            )

        if residual_std < 0.01:
            return Finding(
                id=self.id,
                label=self.label,
                direction=Direction.NEUTRAL,
                strength=0.1,
                code="spectral.flat",
                summary=(
                    "The spectrum is too smooth to carry usable evidence, typically "
                    "the result of heavy compression or resizing."
                ),
                measurements=measurements,
                caveat="Re-compression destroys the artefacts this analysis looks for.",
            )

        return Finding(
            id=self.id,
            label=self.label,
            direction=Direction.AUTHENTIC,
            strength=0.35,
            code="spectral.natural",
            summary=(
                "The spectrum falls off smoothly, as expected from optics and a "
                "camera sensor."
            ),
            measurements=measurements,
            caveat="Some generators reproduce a natural falloff convincingly.",
        )


class NoiseAnalyzer:
    """Examines the sensor-noise residual.

    Every camera sensor imposes a faint, spatially-varying noise pattern.
    Crucially the *level* varies with local brightness, because photon shot
    noise scales with signal. Generated images tend to carry noise that is
    either absent or unnaturally uniform across the frame.

    Method: high-pass the image to isolate the residual, then compare noise
    energy across brightness bands. Real photographs show a clear brightness
    dependence; a flat profile is suspicious.
    """

    id = "noise"
    label = "Sensor noise"

    def run(self, data: AnalysisInput) -> Finding | None:
        gray = data.gray
        if gray.shape[0] < 64 or gray.shape[1] < 64:
            return None

        # 3x3 Laplacian: cheap high-pass that isolates the residual while
        # suppressing smooth image content.
        kernel = np.array([[0, -1, 0], [-1, 4, -1], [0, -1, 0]], dtype=np.float64)
        padded = np.pad(gray, 1, mode="reflect")
        residual = np.zeros_like(gray)
        for dy in range(3):
            for dx in range(3):
                residual += kernel[dy, dx] * padded[dy : dy + gray.shape[0], dx : dx + gray.shape[1]]

        noise_level = float(np.abs(residual).mean())

        # Bin by luminance and measure noise within each band.
        bands = [(0.0, 0.25), (0.25, 0.5), (0.5, 0.75), (0.75, 1.0)]
        band_noise: list[float] = []
        for lo, hi in bands:
            mask = (gray >= lo) & (gray < hi)
            if mask.sum() > gray.size * 0.02:  # ignore barely-populated bands
                band_noise.append(float(np.abs(residual[mask]).mean()))

        measurements = {
            "mean_noise": round(noise_level, 6),
            "band_noise": [round(b, 6) for b in band_noise],
            "bands_sampled": len(band_noise),
        }

        if len(band_noise) < 3:
            return None  # too little tonal range to judge

        spread = max(band_noise) - min(band_noise)
        relative_spread = spread / max(np.mean(band_noise), 1e-9)
        measurements["relative_spread"] = round(float(relative_spread), 4)

        if noise_level < 0.002:
            return Finding(
                id=self.id,
                label=self.label,
                direction=Direction.SYNTHETIC,
                strength=0.55,
                code="noise.denoised",
                summary=(
                    "Almost no sensor noise is present, which is unusual for a "
                    "camera-captured image."
                ),
                measurements=measurements,
                caveat=(
                    "Denoising, upscaling, and aggressive compression all remove noise "
                    "from genuine photographs."
                ),
            )

        if relative_spread < 0.25:
            return Finding(
                id=self.id,
                label=self.label,
                direction=Direction.SYNTHETIC,
                strength=clamp01((0.25 - relative_spread) / 0.25 * 0.6),
                code="noise.uniform",
                summary=(
                    "Noise is unnaturally uniform across bright and dark regions, "
                    "where sensor noise would normally vary with brightness."
                ),
                measurements=measurements,
                caveat="Flat lighting or a narrow tonal range can suppress this variation.",
            )

        return Finding(
            id=self.id,
            label=self.label,
            direction=Direction.AUTHENTIC,
            strength=0.5,
            code="noise.varies",
            summary=(
                "Noise varies with local brightness, consistent with a physical "
                "camera sensor."
            ),
            measurements=measurements,
            caveat="Synthetic noise can be added deliberately to imitate this.",
        )
