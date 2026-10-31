"""Business pack loader service.

Handles dynamic discovery, reading, validating, and updating of Markdown
business packs located in the repository root business-packs/ directory.
"""

import re
from pathlib import Path
from typing import Dict, List, Optional
from app.config import BUSINESS_PACKS_DIR


# Custom Exception Hierarchy
class BusinessPackError(Exception):
    """Base exception for all business pack operations."""
    pass


class InvalidBusinessIdError(ValueError, BusinessPackError):
    """Raised when a business ID is malformed or invalid."""
    pass


class BusinessNotFoundError(FileNotFoundError, BusinessPackError):
    """Raised when the requested business pack directory does not exist."""
    pass


class InvalidFilenameError(ValueError, BusinessPackError):
    """Raised when a filename contains path traversal or invalid characters."""
    pass


class PackFileNotFoundError(FileNotFoundError, BusinessPackError):
    """Raised when a requested file inside a business pack is not found."""
    pass


class PackFileIOError(IOError, BusinessPackError):
    """Raised when an I/O error occurs while reading or writing a pack file."""
    pass


# Validation pattern: alphanumeric characters, hyphens, and underscores only
BUSINESS_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]+$")


def validate_business_id(business_id: str) -> str:
    """Validate that the business ID is non-empty and contains safe characters.

    Args:
        business_id: Business slug/folder name.

    Returns:
        Stripped valid business ID string.

    Raises:
        InvalidBusinessIdError: If the ID is empty, malformed, or attempts traversal.
    """
    if not business_id or not isinstance(business_id, str):
        raise InvalidBusinessIdError("Business ID cannot be empty.")

    clean_id = business_id.strip()
    if not clean_id:
        raise InvalidBusinessIdError("Business ID cannot be blank or whitespace.")

    if not BUSINESS_ID_REGEX.match(clean_id):
        raise InvalidBusinessIdError(
            f"Invalid business ID '{business_id}'. Only alphanumeric characters, dashes, and underscores are allowed."
        )

    return clean_id


def validate_filename(filename: str) -> str:
    """Validate that the filename is a single Markdown file without path traversal.

    Args:
        filename: Name of the file (e.g. pricing_menu.md).

    Returns:
        Stripped valid filename string.

    Raises:
        InvalidFilenameError: If filename contains path separators, invalid extension, or illegal characters.
    """
    if not filename or not isinstance(filename, str):
        raise InvalidFilenameError("Filename cannot be empty.")

    clean_name = filename.strip()
    if not clean_name:
        raise InvalidFilenameError("Filename cannot be whitespace.")

    # Must be just a filename, without directory navigation
    if Path(clean_name).name != clean_name or "/" in clean_name or "\\" in clean_name or ".." in clean_name:
        raise InvalidFilenameError(
            f"Invalid filename '{filename}'. Path traversal and directory separators are strictly prohibited."
        )

    if not clean_name.lower().endswith(".md"):
        raise InvalidFilenameError(
            f"Invalid file extension for '{filename}'. Only Markdown (.md) files are supported."
        )

    # Disallow invalid filesystem characters
    invalid_chars = set(':*?"<>|\0')
    if any(c in invalid_chars for c in clean_name):
        raise InvalidFilenameError(
            f"Filename contains illegal filesystem characters: '{filename}'"
        )

    return clean_name


def _get_business_directory(business_id: str) -> Path:
    """Resolve and securely verify the business pack directory path.

    Args:
        business_id: Validated business identifier.

    Returns:
        Resolved Path to the business pack directory.

    Raises:
        InvalidBusinessIdError: If path escapes the business-packs root.
    """
    clean_id = validate_business_id(business_id)
    packs_root = BUSINESS_PACKS_DIR.resolve()
    business_dir = (packs_root / clean_id).resolve()

    # Enforce directory confinement: must be a strict child of BUSINESS_PACKS_DIR
    if not business_dir.is_relative_to(packs_root) or business_dir == packs_root:
        raise InvalidBusinessIdError(
            f"Security violation: Business ID '{business_id}' attempts to escape business-packs directory."
        )

    return business_dir


def _parse_profile_markdown(business_id: str, content: str) -> Dict[str, str]:
    """Extract business name, category, and description from profile.md content.

    Args:
        business_id: Business identifier slug.
        content: UTF-8 string content of profile.md.

    Returns:
        Dictionary with business_id, name, category, and description.
    """
    fallback_name = business_id.replace("-", " ").replace("_", " ").title()
    name = fallback_name
    category = "General Business"
    description = f"Markdown skill pack for {fallback_name}."

    if not content:
        return {
            "business_id": business_id,
            "name": name,
            "category": category,
            "description": description,
        }

    lines = [line.strip() for line in content.splitlines()]

    for line in lines:
        if not line:
            continue

        # Extract name from primary header: # Business Name
        if line.startswith("#") and name == fallback_name:
            header_text = line.lstrip("#").strip()
            if header_text:
                name = header_text
            continue

        # Extract category: "Category: ...", "**Category:** ...", etc.
        lower_line = line.lower()
        if lower_line.startswith(("category:", "**category:**", "- category:")):
            parts = line.split(":", 1)
            if len(parts) > 1:
                val = parts[1].strip().strip("*").strip()
                if val:
                    category = val
            continue

        # Extract description: "Description: ...", "**Description:** ...", etc.
        if lower_line.startswith(("description:", "**description:**", "- description:")):
            parts = line.split(":", 1)
            if len(parts) > 1:
                val = parts[1].strip().strip("*").strip()
                if val:
                    description = val
            continue

        # Fallback description from the first non-heading plain text paragraph
        if description == f"Markdown skill pack for {fallback_name}." and not line.startswith(("#", "-", "*", ">")):
            description = line

    return {
        "business_id": business_id,
        "name": name,
        "category": category,
        "description": description,
    }


def list_available_businesses() -> List[Dict[str, str]]:
    """Scan the business-packs directory dynamically and return metadata for each pack.

    Returns:
        List of dictionaries with business_id, name, category, and description.
    """
    businesses: List[Dict[str, str]] = []
    packs_root = BUSINESS_PACKS_DIR.resolve()

    if not packs_root.exists() or not packs_root.is_dir():
        return businesses

    for business_path in sorted(packs_root.iterdir()):
        # Include only non-hidden directories
        if business_path.is_dir() and not business_path.name.startswith("."):
            business_id = business_path.name
            profile_file = business_path / "profile.md"

            content = ""
            if profile_file.exists() and profile_file.is_file():
                try:
                    content = profile_file.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    content = ""

            metadata = _parse_profile_markdown(business_id, content)
            businesses.append(metadata)

    return businesses


def load_business_pack(business_id: str) -> Dict[str, str]:
    """Read all Markdown (.md) files for a given business pack.

    Args:
        business_id: Validated business identifier.

    Returns:
        Dictionary mapping filename to file content.

    Raises:
        InvalidBusinessIdError: If business_id is invalid or attempts traversal.
        BusinessNotFoundError: If the business folder does not exist.
        PackFileIOError: If an unrecoverable I/O error occurs.
    """
    business_dir = _get_business_directory(business_id)

    if not business_dir.exists() or not business_dir.is_dir():
        raise BusinessNotFoundError(f"Business pack '{business_id}' does not exist.")

    files: Dict[str, str] = {}
    try:
        for file_path in sorted(business_dir.glob("*.md")):
            if file_path.is_file():
                resolved_file = file_path.resolve()
                # Security confinement check per file
                if resolved_file.is_relative_to(business_dir):
                    try:
                        files[file_path.name] = resolved_file.read_text(
                            encoding="utf-8",
                            errors="replace",
                        )
                    except Exception as err:
                        raise PackFileIOError(
                            f"Error reading '{file_path.name}' in business pack '{business_id}': {err}"
                        ) from err
    except BusinessPackError:
        raise
    except Exception as err:
        raise PackFileIOError(
            f"Failed to scan files for business pack '{business_id}': {err}"
        ) from err

    return files


# Backward-compatible alias
get_business_pack = load_business_pack


def update_business_pack_file(business_id: str, filename: str, content: str) -> bool:
    """Safely update an existing Markdown file inside the selected business folder.

    Args:
        business_id: Validated business identifier.
        filename: Validated Markdown filename (e.g. pricing_menu.md).
        content: New Markdown content string.

    Returns:
        True upon successful file write.

    Raises:
        InvalidBusinessIdError: If business_id is invalid or attempts traversal.
        BusinessNotFoundError: If the business directory does not exist.
        InvalidFilenameError: If filename is invalid or attempts traversal.
        PackFileNotFoundError: If the file does not already exist in the pack.
        PackFileIOError: If writing to the file fails.
    """
    business_dir = _get_business_directory(business_id)

    if not business_dir.exists() or not business_dir.is_dir():
        raise BusinessNotFoundError(f"Business pack '{business_id}' does not exist.")

    clean_filename = validate_filename(filename)
    target_file = (business_dir / clean_filename).resolve()

    # Security confinement check
    if not target_file.is_relative_to(business_dir):
        raise InvalidFilenameError(
            f"Security violation: File path '{filename}' escapes the business pack directory."
        )

    # Restriction: Only allow updates to existing Markdown files
    if not target_file.exists() or not target_file.is_file():
        raise PackFileNotFoundError(
            f"File '{clean_filename}' does not exist in business pack '{business_id}'. "
            f"Only existing Markdown files can be updated."
        )

    try:
        target_file.write_text(content, encoding="utf-8")
        return True
    except Exception as err:
        raise PackFileIOError(
            f"Failed to write file '{clean_filename}' in '{business_id}': {err}"
        ) from err
