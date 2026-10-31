"""Backend verification test suite for Open Business AI."""

import sys
from pathlib import Path

# Add backend directory to sys.path so app imports work
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import (
    ALLOWED_ORIGINS,
    APP_TITLE,
    BUSINESS_PACKS_DIR,
    REPO_ROOT,
)
from app.main import app
from app.api.schemas import (
    BusinessItem,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    UpdateFileRequest,
)
from app.services.pack_loader import (
    BusinessNotFoundError,
    InvalidBusinessIdError,
    InvalidFilenameError,
    PackFileNotFoundError,
    _parse_profile_markdown,
    list_available_businesses,
    load_business_pack,
    update_business_pack_file,
    validate_business_id,
    validate_filename,
)

client = TestClient(app)


def test_configuration():
    """Verify paths and configuration."""
    print("Testing Configuration...")
    assert REPO_ROOT.exists(), f"Repo root does not exist: {REPO_ROOT}"
    assert BUSINESS_PACKS_DIR.exists(), f"Business packs dir not found: {BUSINESS_PACKS_DIR}"
    assert "http://localhost:5173" in ALLOWED_ORIGINS
    print(f"  [OK] Repo Root: {REPO_ROOT}")
    print(f"  [OK] Business Packs Directory: {BUSINESS_PACKS_DIR}")
    print(f"  [OK] CORS Origins: {ALLOWED_ORIGINS}")


def test_pydantic_schemas_valid():
    """Verify schema models with valid data."""
    print("\nTesting Pydantic Schemas (Valid inputs)...")
    
    item = BusinessItem(
        business_id="sweet-home-kitchen",
        name="Sweet Home Kitchen",
        category="Bakery",
        description="Fresh pastries and cakes."
    )
    assert item.business_id == "sweet-home-kitchen"
    
    msg = ChatMessage(sender="customer", text="Hello!")
    assert msg.sender == "customer"
    
    req = ChatRequest(
        business_id="sweet-home-kitchen",
        message="What are your hours?",
        conversation_history=[msg]
    )
    assert req.business_id == "sweet-home-kitchen"
    
    res = ChatResponse(
        reply="We are open 8am to 6pm.",
        status="success",
        business_id="sweet-home-kitchen",
        escalation_reason=None
    )
    assert res.status == "success"
    
    upd = UpdateFileRequest(filename="pricing_menu.md", content="# Pricing")
    assert upd.filename == "pricing_menu.md"
    print("  [OK] Valid schemas instantiated successfully.")


def test_pydantic_schemas_invalid():
    """Verify schema models reject invalid data."""
    print("\nTesting Pydantic Schemas (Validation rules)...")
    
    try:
        BusinessItem(business_id="   ", name="Bakery", category="Food", description="Desc")
        assert False, "Should have rejected empty business_id"
    except ValidationError:
        print("  [OK] Rejected empty business_id")

    try:
        ChatMessage(sender="robot", text="Hello")  # type: ignore
        assert False, "Should have rejected invalid sender"
    except ValidationError:
        print("  [OK] Rejected invalid sender ('robot')")

    try:
        ChatRequest(business_id="sweet-home-kitchen", message="   ")
        assert False, "Should have rejected empty message"
    except ValidationError:
        print("  [OK] Rejected empty chat message")

    try:
        ChatResponse(reply="Test", status="pending", business_id="test")  # type: ignore
        assert False, "Should have rejected invalid status"
    except ValidationError:
        print("  [OK] Rejected invalid status ('pending')")

    try:
        UpdateFileRequest(filename="config.json", content="{}")
        assert False, "Should have rejected non-.md file"
    except ValidationError:
        print("  [OK] Rejected non-.md filename in UpdateFileRequest")


def test_pack_loader_unit():
    """Verify pack_loader functions, security checks, and error handling."""
    print("\nTesting Pack Loader Service...")

    # 1. Dynamic business discovery
    businesses = list_available_businesses()
    ids = [b["business_id"] for b in businesses]
    assert "sweet-home-kitchen" in ids, "sweet-home-kitchen not discovered"
    assert "elite-properties" in ids, "elite-properties not discovered"
    print(f"  [OK] Discovered {len(businesses)} business packs dynamically: {ids}")

    # 2. Profile Markdown parsing test
    sample_md = (
        "# Artisan Bakehouse\n\n"
        "**Category:** Gourmet Bakery\n"
        "**Description:** Handcrafted sourdough breads and artisan croissants.\n"
    )
    parsed = _parse_profile_markdown("artisan-bakehouse", sample_md)
    assert parsed["name"] == "Artisan Bakehouse"
    assert parsed["category"] == "Gourmet Bakery"
    assert "Handcrafted sourdough" in parsed["description"]
    print("  [OK] Profile Markdown parser accurately extracted name, category, description")

    # 3. Path Traversal & Business ID validation
    for bad_id in ["../", "..\\something", "test/path", "test\\path", "inv@lid", "", "   "]:
        try:
            validate_business_id(bad_id)
            assert False, f"Should have rejected invalid business_id: {bad_id}"
        except InvalidBusinessIdError:
            pass
    print("  [OK] Path traversal and malformed business IDs blocked by validate_business_id")

    # 4. Filename validation
    for bad_file in ["../hack.md", "sub/file.md", "file.txt", "file.py", ":bad.md", ""]:
        try:
            validate_filename(bad_file)
            assert False, f"Should have rejected invalid filename: {bad_file}"
        except InvalidFilenameError:
            pass
    assert validate_filename("pricing_menu.md") == "pricing_menu.md"
    print("  [OK] Path traversal and invalid extensions blocked by validate_filename")

    # 5. load_business_pack() valid and invalid
    pack_files = load_business_pack("sweet-home-kitchen")
    assert isinstance(pack_files, dict)
    print(f"  [OK] Loaded pack for 'sweet-home-kitchen' ({len(pack_files)} .md files)")

    try:
        load_business_pack("non-existent-pack")
        assert False, "Should raise BusinessNotFoundError for unknown pack"
    except BusinessNotFoundError:
        print("  [OK] BusinessNotFoundError raised for unknown pack")

    try:
        load_business_pack("../backend")
        assert False, "Should raise InvalidBusinessIdError on path traversal attempt"
    except InvalidBusinessIdError:
        print("  [OK] Path traversal rejected in load_business_pack")

    # 6. update_business_pack_file() - create temp file to test update & safety
    test_target_file = BUSINESS_PACKS_DIR / "sweet-home-kitchen" / "test_verify.md"
    test_target_file.write_text("# Initial Content", encoding="utf-8")
    try:
        # Successful update of existing file
        updated = update_business_pack_file("sweet-home-kitchen", "test_verify.md", "# Updated Content")
        assert updated is True
        assert test_target_file.read_text(encoding="utf-8") == "# Updated Content"
        print("  [OK] Successfully updated existing Markdown file with UTF-8 encoding")

        # Attempting update on non-existent file should raise PackFileNotFoundError
        try:
            update_business_pack_file("sweet-home-kitchen", "does_not_exist.md", "Content")
            assert False, "Should reject update to non-existent file"
        except PackFileNotFoundError:
            print("  [OK] PackFileNotFoundError raised when trying to update non-existent file")

        # Attempting path traversal during update
        try:
            update_business_pack_file("sweet-home-kitchen", "../outside.md", "Content")
            assert False, "Should reject traversal filename"
        except InvalidFilenameError:
            print("  [OK] Traversal filename blocked in update_business_pack_file")

    finally:
        if test_target_file.exists():
            test_target_file.unlink()


def test_ai_service_unit():
    """Verify AI service functions and escalation behaviors."""
    print("\nTesting AI Service Integration...")
    import asyncio
    from app.services.ai_service import MODEL_NAME, generate_business_reply
    from app.config import DEFAULT_MODEL

    # Verify model configuration alignment
    assert MODEL_NAME == DEFAULT_MODEL
    print(f"  [OK] Model Name correctly sourced from central config: {MODEL_NAME}")

    # Verify escalation when pack_context is empty
    empty_result = asyncio.run(
        generate_business_reply(
            business_id="sweet-home-kitchen",
            customer_message="What are your hours?",
            conversation_history=[],
            pack_context={},
        )
    )
    assert empty_result["status"] == "escalated"
    assert "empty" in empty_result["escalation_reason"].lower()
    print("  [OK] Empty knowledge pack triggers immediate escalation without guessing")


def test_api_endpoints():
    """Verify FastAPI routes using TestClient."""
    print("\nTesting API Endpoints...")
    
    # Root
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["app"] == APP_TITLE
    print("  [OK] GET / -> 200")

    # Health
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
    print("  [OK] GET /api/health -> 200")

    # List businesses (dynamic)
    resp = client.get("/api/businesses")
    assert resp.status_code == 200
    businesses = resp.json()
    assert isinstance(businesses, list)
    assert len(businesses) >= 2
    b_ids = [b["business_id"] for b in businesses]
    assert "sweet-home-kitchen" in b_ids
    assert "elite-properties" in b_ids
    print(f"  [OK] GET /api/businesses -> 200 (Discovered {len(businesses)} businesses)")

    # Get business pack
    resp = client.get("/api/businesses/sweet-home-kitchen/pack")
    assert resp.status_code == 200
    pack_data = resp.json()
    assert pack_data["business_id"] == "sweet-home-kitchen"
    assert "files" in pack_data
    print("  [OK] GET /api/businesses/sweet-home-kitchen/pack -> 200")

    # 404 for non-existent business
    resp = client.get("/api/businesses/unknown-shop/pack")
    assert resp.status_code == 404
    print("  [OK] GET /api/businesses/unknown-shop/pack -> 404")

    # 400 for path traversal in URL
    resp = client.get("/api/businesses/..%2Fevil/pack")
    assert resp.status_code in (400, 404)
    print("  [OK] GET /api/businesses/../pack -> Blocked")

    # POST /api/chat valid
    chat_payload = {
        "business_id": "sweet-home-kitchen",
        "message": "Do you make vegan cakes?",
        "conversation_history": []
    }
    resp = client.post("/api/chat", json=chat_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("success", "escalated")
    assert data["business_id"] == "sweet-home-kitchen"
    print("  [OK] POST /api/chat (valid) -> 200")

    # POST /api/chat invalid (empty message)
    invalid_chat = {
        "business_id": "sweet-home-kitchen",
        "message": ""
    }
    resp = client.post("/api/chat", json=invalid_chat)
    assert resp.status_code == 422
    print("  [OK] POST /api/chat (empty message) -> 422 Unprocessable Entity")

    # PUT /api/businesses/{id}/pack - update non-existent file returns 404
    resp = client.put(
        "/api/businesses/sweet-home-kitchen/pack",
        json={"filename": "ghost.md", "content": "Ghost content"}
    )
    assert resp.status_code == 404
    print("  [OK] PUT /api/businesses/sweet-home-kitchen/pack (missing file) -> 404")


def test_cors():
    """Verify CORS headers on preflight requests."""
    print("\nTesting CORS Headers...")
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
    }
    resp = client.options("/api/chat", headers=headers)
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"
    print("  [OK] CORS preflight allowed for http://localhost:5173")


if __name__ == "__main__":
    print(f"=== Running Verification for {APP_TITLE} Backend ===\n")
    test_configuration()
    test_pydantic_schemas_valid()
    test_pydantic_schemas_invalid()
    test_pack_loader_unit()
    test_ai_service_unit()
    test_api_endpoints()
    test_cors()
    print("\n=== ALL BACKEND CHECKS PASSED SUCCESSFULLY ===")
