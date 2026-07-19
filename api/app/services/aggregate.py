"""Combining analyzer findings into an assessment.

This module is where a media-verification tool is most tempted to overstate
what it knows, so the rules it follows are written down rather than implied:

1. The composite score is a documented weighted sum of heuristics. It is not
   a probability, and `Assessment.calibrated` stays False until the weights
   have been validated against a labelled corpus. Nothing downstream may
   present it as a probability while that flag is False.

2. Weights encode how much each signal can actually carry. A signed C2PA
   provenance marker is specific and hard to fake accidentally; Error Level
   Analysis is famously noisy. Weighting them equally would be convenient
   and wrong.

3. Thin evidence widens the verdict toward INCONCLUSIVE rather than letting
   one surviving signal decide. A heavily compressed screenshot destroys most
   of what these analyzers read, and the honest answer there is "cannot tell".

4. Disagreement is surfaced, not smoothed. When signals point in opposite
   directions the summary says so.
"""

from __future__ import annotations

from app.schemas.analysis import Assessment, Direction, Finding, Verdict

#: How much each analyzer contributes, reflecting how much it can actually
#: support. Provenance markers are specific and deliberate; ELA is noisy and
#: easily confounded by ordinary texture.
ANALYZER_WEIGHTS: dict[str, float] = {
    "metadata": 1.0,
    "noise": 0.8,
    "spectral": 0.7,
    "quantization": 0.5,
    "ela": 0.3,
}

#: Below this total weight, too little survived to support any verdict.
MIN_EVIDENCE_FOR_VERDICT = 1.2

#: Total weight at which evidence is considered complete, for reporting
#: `evidence_strength` as a percentage.
FULL_EVIDENCE = sum(ANALYZER_WEIGHTS.values())

LIMITATIONS = [
    "Detection of AI-generated media is an open research problem. This tool "
    "reports indicators, not proof.",
    "Compression, resizing, and screenshotting destroy most of the signals "
    "these analyzers depend on.",
    "Metadata can be edited or removed, so its presence and absence are both "
    "weak evidence in isolation.",
    "The scoring weights are documented heuristics and have not been "
    "calibrated against a labelled dataset.",
]


def _verdict_for(score: float, evidence: float) -> Verdict:
    """Map a score to a band, widening toward inconclusive when evidence is thin.

    The margin required to leave INCONCLUSIVE grows as evidence weakens, so a
    single surviving signal cannot push the result to a confident band.
    """
    if evidence < MIN_EVIDENCE_FOR_VERDICT:
        return Verdict.INCONCLUSIVE

    confidence_ratio = min(1.0, evidence / FULL_EVIDENCE)
    # 12 points of slack at full evidence, up to 25 when evidence is minimal.
    margin = 12.0 + (1.0 - confidence_ratio) * 13.0

    if score >= 50 + margin * 2:
        return Verdict.LIKELY_SYNTHETIC
    if score >= 50 + margin:
        return Verdict.LEANING_SYNTHETIC
    if score <= 50 - margin * 2:
        return Verdict.LIKELY_AUTHENTIC
    if score <= 50 - margin:
        return Verdict.LEANING_AUTHENTIC
    return Verdict.INCONCLUSIVE


def _summarise(
    verdict: Verdict, findings: list[Finding], conflicted: bool, evidence: float
) -> str:
    if not findings:
        return (
            "No analyzer produced a usable measurement for this file, so no "
            "assessment can be offered."
        )

    if verdict is Verdict.INCONCLUSIVE:
        if evidence < MIN_EVIDENCE_FOR_VERDICT:
            return (
                "Too little forensic evidence survived in this file to support an "
                "assessment. This usually means it has been compressed, resized, or "
                "screenshotted — all of which erase the traces these analyses rely on."
            )
        return (
            "The analyses disagree, with indicators pointing in both directions and "
            "none strong enough to settle it. Treat this as genuinely undetermined "
            "rather than as a weak result in either direction."
        )

    leaning = "generated" if "synthetic" in verdict.value else "camera-captured"
    lead = [f for f in findings if f.direction is not Direction.NEUTRAL]
    lead.sort(key=lambda f: f.strength * ANALYZER_WEIGHTS.get(f.id, 0.5), reverse=True)
    drivers = ", ".join(f.label.lower() for f in lead[:2]) or "the available signals"

    text = (
        f"The strongest indicators — {drivers} — lean toward this being "
        f"{leaning} media. This is a confidence estimate built from several "
        "independent measurements, not proof."
    )
    if conflicted:
        text += (
            " Note that at least one analysis pointed the other way; the per-signal "
            "findings below show where they disagree."
        )
    return text


def aggregate(findings: list[Finding]) -> Assessment:
    """Combine findings into an assessment.

    Score is a weighted average on a 0-100 axis where 0 is fully
    authentic-leaning and 100 fully synthetic-leaning. Neutral findings pull
    toward 50 in proportion to their weight, which is what makes an
    inconclusive pile of evidence read as inconclusive rather than as a tie
    that happens to land on one side.
    """
    if not findings:
        return Assessment(
            verdict=Verdict.INCONCLUSIVE,
            synthetic_likelihood=50.0,
            evidence_strength=0.0,
            calibrated=False,
            summary=_summarise(Verdict.INCONCLUSIVE, [], False, 0.0),
            findings=[],
            limitations=LIMITATIONS,
        )

    total_weight = 0.0
    weighted_score = 0.0

    for finding in findings:
        weight = ANALYZER_WEIGHTS.get(finding.id, 0.5) * finding.strength
        if finding.direction is Direction.SYNTHETIC:
            position = 100.0
        elif finding.direction is Direction.AUTHENTIC:
            position = 0.0
        else:
            position = 50.0

        weighted_score += position * weight
        total_weight += weight

    score = weighted_score / total_weight if total_weight > 1e-9 else 50.0

    directions = {f.direction for f in findings}
    conflicted = (
        Direction.SYNTHETIC in directions and Direction.AUTHENTIC in directions
    )

    verdict = _verdict_for(score, total_weight)
    evidence_pct = min(100.0, total_weight / FULL_EVIDENCE * 100.0)

    return Assessment(
        verdict=verdict,
        synthetic_likelihood=round(score, 1),
        evidence_strength=round(evidence_pct, 1),
        calibrated=False,
        summary=_summarise(verdict, findings, conflicted, total_weight),
        findings=findings,
        limitations=LIMITATIONS,
    )
