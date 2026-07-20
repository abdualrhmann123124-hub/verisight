"""Metadata and provenance.

The highest-signal analyzer in the set, and also the easiest to over-read.

C2PA Content Credentials are a real, cryptographically-signed provenance
standard that several major generators embed. Finding that marker is strong,
specific evidence. Everything else here — camera tags, software tags, missing
EXIF — is circumstantial, because metadata is trivially editable and every
major platform strips it on upload.

The strength scores below reflect that asymmetry deliberately: a positive
C2PA hit scores high, while absent EXIF scores low.
"""

from __future__ import annotations

from PIL import Image
from PIL.ExifTags import TAGS

from app.analyzers.base import AnalysisInput
from app.schemas.analysis import Direction, Finding

#: Substrings that appear in the metadata of known generative pipelines.
#: Matched case-insensitively against raw bytes and software tags.
GENERATOR_MARKERS = (
    b"c2pa",
    b"contentcredentials",
    b"trainedAlgorithmicMedia",
    b"stable-diffusion",
    b"stablediffusion",
    b"midjourney",
    b"dall-e",
    b"dalle",
    b"firefly",
    b"imagen",
    b"novelai",
    b"invokeai",
    b"comfyui",
    b"automatic1111",
)

#: Software strings that indicate an edit, which is not the same as a
#: fabrication — most published photography passes through one of these.
EDITOR_MARKERS = (
    "photoshop",
    "lightroom",
    "gimp",
    "affinity",
    "capture one",
    "snapseed",
    "picsart",
)


class MetadataAnalyzer:
    id = "metadata"
    label = "Metadata & provenance"

    def run(self, data: AnalysisInput) -> Finding | None:
        exif_tags: dict[str, object] = {}
        try:
            raw_exif = data.image.getexif()
            for tag_id, value in raw_exif.items():
                name = TAGS.get(tag_id, str(tag_id))
                exif_tags[name] = value
        except (AttributeError, OSError, ValueError):
            # A malformed EXIF block is common and not fatal; treat it as
            # absent rather than failing the whole analysis.
            exif_tags = {}

        lowered = data.raw[:262144].lower()  # header region only, not the pixels
        generator_hits = [
            marker.decode("ascii", "ignore")
            for marker in GENERATOR_MARKERS
            if marker.lower() in lowered
        ]

        make = str(exif_tags.get("Make", "") or "").strip()
        model = str(exif_tags.get("Model", "") or "").strip()
        software = str(exif_tags.get("Software", "") or "").strip()

        has_camera = bool(make or model)
        is_editor = any(m in software.lower() for m in EDITOR_MARKERS)

        measurements = {
            "exif_tag_count": len(exif_tags),
            "camera_make": make or None,
            "camera_model": model or None,
            "software": software or None,
            "generator_markers": generator_hits,
        }

        # A declared generator marker outranks everything else here.
        if generator_hits:
            return Finding(
                id=self.id,
                label=self.label,
                direction=Direction.SYNTHETIC,
                strength=0.95,
                code="metadata.generator",
                summary=(
                    "The file carries provenance data associated with AI generation "
                    f"({', '.join(generator_hits[:3])})."
                ),
                measurements=measurements,
                caveat=(
                    "Markers like these are embedded voluntarily by the generator "
                    "and can be stripped, so their absence proves nothing."
                ),
            )

        if has_camera:
            return Finding(
                id=self.id,
                label=self.label,
                direction=Direction.AUTHENTIC,
                strength=0.45,
                code="metadata.camera",
                summary=(
                    f"Camera metadata is present ({make} {model}".strip()
                    + "), consistent with a photograph."
                ),
                measurements=measurements,
                caveat=(
                    "EXIF fields are editable with ordinary tools, so camera tags "
                    "can be copied onto a generated image."
                ),
            )

        if is_editor:
            return Finding(
                id=self.id,
                label=self.label,
                direction=Direction.NEUTRAL,
                strength=0.3,
                code="metadata.editor",
                summary=(
                    f"The file was exported by editing software ({software}), with no "
                    "camera signature."
                ),
                measurements=measurements,
                caveat=(
                    "Editing is routine for published photography and is not itself "
                    "evidence of fabrication."
                ),
            )

        if not exif_tags:
            return Finding(
                id=self.id,
                label=self.label,
                direction=Direction.NEUTRAL,
                strength=0.15,
                code="metadata.none",
                summary="No embedded metadata was found.",
                measurements=measurements,
                caveat=(
                    "Weak evidence on its own: X, Instagram, WhatsApp and most other "
                    "platforms strip metadata from every upload."
                ),
            )

        return Finding(
            id=self.id,
            label=self.label,
            direction=Direction.NEUTRAL,
            strength=0.2,
            code="metadata.partial",
            summary=(
                f"{len(exif_tags)} metadata tags present, but none identify a camera "
                "or a generator."
            ),
            measurements=measurements,
            caveat="Partial metadata is common after resizing or format conversion.",
        )
