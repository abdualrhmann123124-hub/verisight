"""Analysis endpoints.

Routes validate, delegate, and serialise. No analysis logic lives here.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.schemas.analysis import AnalysisResponse
from app.services.pipeline import (
    MediaTooLargeError,
    UnsupportedMediaError,
    analyze_bytes,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["analysis"])

ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Analyze an image for indicators of AI generation",
)
async def analyze(file: UploadFile = File(...)) -> AnalysisResponse:
    # The declared content type is a hint from the client and trivially
    # spoofed, so it is only a fast rejection path. Whether the bytes are
    # genuinely a decodable image is settled by the decoder in the pipeline.
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Supported formats are PNG, JPEG, and WEBP.",
        )

    raw = await file.read()
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    try:
        return analyze_bytes(raw, file.filename or "upload")
    except MediaTooLargeError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(exc)
        ) from exc
    except UnsupportedMediaError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except Exception as exc:
        # Never leak a stack trace to the client; log it and return a generic
        # message the user can act on.
        logger.exception("analysis failed for %s", file.filename)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed while processing this file.",
        ) from exc


@router.get("/limits", summary="Report the service's input limits")
async def limits() -> dict[str, object]:
    """Lets the web app show accurate limits without duplicating constants."""
    return {
        "max_upload_bytes": settings.max_upload_bytes,
        "max_pixels": settings.max_pixels,
        "accepted_types": sorted(ALLOWED_CONTENT_TYPES),
    }
