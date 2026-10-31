"""API routes for Open Business AI."""

from typing import Dict, List
from fastapi import APIRouter, HTTPException, status
from app.api.schemas import (
    BusinessItem,
    BusinessPackResponse,
    ChatRequest,
    ChatResponse,
    UpdateFileRequest,
)
from app.services.ai_service import generate_business_reply
from app.services.pack_loader import (
    BusinessNotFoundError,
    InvalidBusinessIdError,
    InvalidFilenameError,
    PackFileIOError,
    PackFileNotFoundError,
    list_available_businesses,
    load_business_pack,
    update_business_pack_file,
)

router = APIRouter()


@router.get(
    "/health",
    summary="Health Check",
    tags=["Health"],
)
async def health_check() -> Dict[str, str]:
    """Health endpoint to verify API server is running."""
    return {"status": "ok", "app": "Open Business AI"}


@router.get(
    "/businesses",
    response_model=List[BusinessItem],
    summary="List Available Businesses",
    tags=["Businesses"],
)
async def get_businesses() -> List[BusinessItem]:
    """Return all dynamically discovered business packs in business-packs/ directory."""
    raw_businesses = list_available_businesses()
    return [BusinessItem(**b) for b in raw_businesses]


@router.get(
    "/businesses/{business_id}/pack",
    response_model=BusinessPackResponse,
    summary="Get Business Pack Details",
    tags=["Businesses"],
)
async def get_business_pack_endpoint(business_id: str) -> BusinessPackResponse:
    """Retrieve all Markdown knowledge files for a specific business pack."""
    try:
        files = load_business_pack(business_id)
        return BusinessPackResponse(business_id=business_id, files=files)
    except InvalidBusinessIdError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except BusinessNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except PackFileIOError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Process Customer Chat Message",
    tags=["Chat"],
)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """Receive customer query, validate business pack, and generate AI response."""
    # Verify business pack exists and load its Markdown knowledge files
    try:
        pack_context = load_business_pack(request.business_id)
    except InvalidBusinessIdError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except BusinessNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business pack '{request.business_id}' not found.",
        )
    except PackFileIOError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )

    # Convert conversation history objects to list of dicts expected by ai_service
    history = [msg.model_dump() for msg in request.conversation_history]

    # Generate grounded AI reply using Member 3's AI service
    ai_result = await generate_business_reply(
        business_id=request.business_id,
        customer_message=request.message,
        conversation_history=history,
        pack_context=pack_context,
    )

    return ChatResponse(**ai_result)


@router.put(
    "/businesses/{business_id}/pack",
    summary="Update Business Pack File",
    tags=["Businesses"],
)
async def update_business_pack_endpoint(
    business_id: str,
    request: UpdateFileRequest,
) -> Dict[str, str]:
    """Update a specific Markdown file inside a business pack."""
    try:
        update_business_pack_file(
            business_id=business_id,
            filename=request.filename,
            content=request.content,
        )
        return {
            "status": "success",
            "message": f"File '{request.filename}' updated successfully for '{business_id}'.",
        }
    except (InvalidBusinessIdError, InvalidFilenameError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except (BusinessNotFoundError, PackFileNotFoundError) as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except PackFileIOError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )
