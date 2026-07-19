"""Shared analyzer types.

Every analyzer takes the decoded image plus the original bytes and returns a
Finding, or None when it has nothing useful to say. Returning None is a
first-class outcome: an analyzer that only works on JPEG should abstain on a
PNG rather than manufacture a neutral result that dilutes the aggregate.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

import numpy as np
from PIL import Image

from app.schemas.analysis import Finding


@dataclass(frozen=True)
class AnalysisInput:
    """Everything an analyzer may need, prepared once and shared."""

    #: Original file bytes, untouched. Needed by analyzers that inspect
    #: container structure rather than pixels.
    raw: bytes
    filename: str
    media_type: str
    #: Full-resolution decoded image, RGB.
    image: Image.Image
    #: Downscaled grayscale float array in [0, 1], for the pixel-statistics
    #: analyzers. Prepared once because computing it per analyzer would
    #: dominate the runtime.
    gray: np.ndarray
    width: int
    height: int


class Analyzer(Protocol):
    id: str
    label: str

    def run(self, data: AnalysisInput) -> Finding | None: ...


def clamp01(value: float) -> float:
    """Constrain a score to [0, 1].

    Analyzer heuristics are ratios that can exceed their expected range on
    unusual input; clamping keeps a single odd measurement from dominating
    the aggregate.
    """
    return max(0.0, min(1.0, float(value)))
