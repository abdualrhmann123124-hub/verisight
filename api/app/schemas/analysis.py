"""Request and response models.

These are the contract with the web app. The TypeScript side mirrors them, so
any change here is a breaking change there — keep field names stable.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Direction(str, Enum):
    """Which way a signal leans.

    Deliberately three-valued. A signal that found nothing conclusive reports
    NEUTRAL rather than being forced toward one side, and a report full of
    NEUTRAL findings is a legitimate outcome that should read as "we could not
    tell" rather than as a weak accusation.
    """

    AUTHENTIC = "authentic"
    NEUTRAL = "neutral"
    SYNTHETIC = "synthetic"


class Finding(BaseModel):
    """One analyzer's result."""

    id: str
    label: str
    direction: Direction
    #: How much this particular measurement supports its direction, 0-1.
    #: Not a probability — a within-analyzer strength score.
    strength: float = Field(ge=0.0, le=1.0)
    #: One sentence a non-specialist can act on.
    summary: str
    #: Stable identifier for this outcome (e.g. "metadata.generator"), so the
    #: UI can localise the summary/caveat instead of showing engine English.
    #: The English text above remains the fallback for unknown codes.
    code: str | None = None
    #: The raw numbers behind the call, so the result can be checked.
    measurements: dict[str, Any] = Field(default_factory=dict)
    #: What this analyzer cannot tell you. Shown in the UI.
    caveat: str | None = None


class Verdict(str, Enum):
    LIKELY_AUTHENTIC = "authentic"
    LEANING_AUTHENTIC = "leaning-authentic"
    INCONCLUSIVE = "inconclusive"
    LEANING_SYNTHETIC = "leaning-synthetic"
    LIKELY_SYNTHETIC = "synthetic"


class Assessment(BaseModel):
    """The combined result.

    `calibrated` is the most important field in this file. It is False, and
    will stay False until the weighting has been validated against a labelled
    corpus. While it is False the UI must present `synthetic_likelihood` as an
    indicative aggregate rather than a probability, because that is what it
    is: a weighted sum of heuristics, not a calibrated estimate.
    """

    verdict: Verdict
    #: 0-100. Weighted aggregate of the findings, not a calibrated probability.
    synthetic_likelihood: float = Field(ge=0.0, le=100.0)
    #: How much evidence was actually available, 0-100. Low means most
    #: analyzers abstained — a heavily compressed screenshot, for instance.
    evidence_strength: float = Field(ge=0.0, le=100.0)
    calibrated: bool = False
    summary: str
    #: Stable identifier for the summary shape ("no-findings", "thin-evidence",
    #: "disagreement", "leaning"), for UI localisation. English is the fallback.
    summary_code: str | None = None
    #: Analyzer ids driving a "leaning" summary, strongest first.
    summary_driver_ids: list[str] = Field(default_factory=list)
    #: Whether at least one analysis pointed the opposite way.
    conflicted: bool = False
    findings: list[Finding]
    limitations: list[str]
    #: Stable identifiers for the limitations list, same order.
    limitation_codes: list[str] = Field(default_factory=list)


class AnalysisResponse(BaseModel):
    filename: str
    media_type: str
    width: int
    height: int
    sha256: str
    processing_ms: int
    assessment: Assessment
    engine_version: str
