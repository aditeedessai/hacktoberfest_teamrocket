"""Pydantic schemas for Open Business AI API."""

from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


class BusinessItem(BaseModel):
    """Metadata representing an available business pack."""
    business_id: str = Field(..., description="Unique slug identifier for the business pack")
    name: str = Field(..., description="Human-readable business name")
    category: str = Field(..., description="Industry or business category")
    description: str = Field(..., description="Brief description of the business")

    @field_validator("business_id", "name", "category", mode="before")
    @classmethod
    def validate_non_empty_strings(cls, value: str) -> str:
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("Field must not be empty")
        return value


class ChatMessage(BaseModel):
    """Individual conversation message."""
    sender: Literal["customer", "assistant"] = Field(..., description="Sender role ('customer' or 'assistant')")
    text: str = Field(..., description="Message text content")

    @field_validator("text", mode="before")
    @classmethod
    def validate_text(cls, value: str) -> str:
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("Message text cannot be empty")
        return value


class ChatRequest(BaseModel):
    """Customer chat inquiry payload."""
    business_id: str = Field(..., description="Target business identifier")
    message: str = Field(..., description="Customer message")
    conversation_history: List[ChatMessage] = Field(default_factory=list, description="Prior conversation context")

    @field_validator("business_id", "message", mode="before")
    @classmethod
    def validate_required_fields(cls, value: str) -> str:
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("Field must not be empty")
        return value


class ChatResponse(BaseModel):
    """Grounded AI response payload."""
    reply: str = Field(..., description="AI assistant reply")
    status: Literal["success", "escalated"] = Field(..., description="Inquiry status ('success' or 'escalated')")
    business_id: str = Field(..., description="Active business identifier")
    escalation_reason: Optional[str] = Field(default=None, description="Reason if inquiry was escalated")

    @field_validator("business_id", mode="before")
    @classmethod
    def validate_business_id(cls, value: str) -> str:
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("business_id cannot be empty")
        return value


class BusinessPackResponse(BaseModel):
    """Full business pack files and contents."""
    business_id: str = Field(..., description="Target business identifier")
    files: Dict[str, str] = Field(default_factory=dict, description="Dictionary mapping Markdown filename to content")

    @field_validator("business_id", mode="before")
    @classmethod
    def validate_business_id(cls, value: str) -> str:
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("business_id cannot be empty")
        return value


class UpdateFileRequest(BaseModel):
    """Request payload to update a Markdown file in a business pack."""
    filename: str = Field(..., description="Markdown filename (e.g., pricing_menu.md)")
    content: str = Field(..., description="Updated Markdown content")

    @field_validator("filename", mode="before")
    @classmethod
    def validate_filename(cls, value: str) -> str:
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("Filename cannot be empty")
        if not value.endswith(".md"):
            raise ValueError("Filename must end with .md")
        return value
