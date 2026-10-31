"""User management and authentication service for Open Business AI.
Provides persistent storage, password hashing, and role-based accounts
for Customers and Business Owners.
"""

import hashlib
import json
import logging
import os
import secrets
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger("open_business_ai.user_service")

# Data directory for persistent storage
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
USERS_FILE = DATA_DIR / "users.json"


def _hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hash a password using SHA-256 with a unique salt."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return hashed, salt


def _verify_password(password: str, password_hash: str, salt: str) -> bool:
    """Verify a plain-text password against a stored hash and salt."""
    expected_hash, _ = _hash_password(password, salt)
    return secrets.compare_digest(expected_hash, password_hash)


def _load_users_from_disk() -> Dict[str, dict]:
    """Load users from the JSON storage file."""
    if not USERS_FILE.exists():
        return {}
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.error("Failed to load users file: %s", exc)
        return {}


def _save_users_to_disk(users: Dict[str, dict]) -> bool:
    """Persist users dictionary to JSON file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
        return True
    except Exception as exc:
        logger.error("Failed to save users file: %s", exc)
        return False


def _init_default_users() -> None:
    """Seed demo accounts for judges and quick testing if users file is empty."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if USERS_FILE.exists() and USERS_FILE.stat().st_size > 5:
        return

    defaults = [
        {
            "id": "usr_customer_demo",
            "name": "Jane Customer",
            "email": "customer@email.com",
            "phone": "+1 (555) 019-2834",
            "role": "customer",
            "business_id": None,
            "password": "password123",
        },
        {
            "id": "usr_bakery_owner",
            "name": "Alice Baker",
            "email": "owner@business.demo",
            "phone": "+1 (555) 234-5678",
            "role": "business_owner",
            "business_id": "sweet-home-kitchen",
            "password": "password123",
        },
        {
            "id": "usr_re_owner",
            "name": "David Broker",
            "email": "elite-properties@openbusiness.demo",
            "phone": "+1 (555) 876-5432",
            "role": "business_owner",
            "business_id": "elite-properties",
            "password": "demo123",
        },
    ]

    users_map = {}
    for item in defaults:
        pwd = item.pop("password")
        pwd_hash, salt = _hash_password(pwd)
        item["password_hash"] = pwd_hash
        item["salt"] = salt
        users_map[item["email"].lower()] = item

    _save_users_to_disk(users_map)
    logger.info("Seeded default demo users in %s", USERS_FILE)


# Initialize users upon module import
_init_default_users()


def register_user(
    name: str,
    email: str,
    password: str,
    role: str = "customer",
    phone: str = "",
    business_id: Optional[str] = None,
) -> dict:
    """Register a new user (Customer or Business Owner)."""
    clean_email = email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise ValueError("A valid email address is required.")

    if not password or len(password) < 4:
        raise ValueError("Password must be at least 4 characters long.")

    users = _load_users_from_disk()
    if clean_email in users:
        raise ValueError(f"User with email '{clean_email}' already exists.")

    pwd_hash, salt = _hash_password(password)
    user_id = f"usr_{secrets.token_hex(6)}"

    new_user = {
        "id": user_id,
        "name": name.strip() or clean_email.split("@")[0].title(),
        "email": clean_email,
        "phone": phone.strip(),
        "role": role if role in ("customer", "business_owner") else "customer",
        "business_id": business_id.strip() if business_id else None,
        "password_hash": pwd_hash,
        "salt": salt,
    }

    users[clean_email] = new_user
    _save_users_to_disk(users)

    # Return safe user profile without password credentials
    safe_profile = dict(new_user)
    safe_profile.pop("password_hash", None)
    safe_profile.pop("salt", None)
    return safe_profile


def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authenticate user credentials and return user profile if valid."""
    clean_email = email.strip().lower()
    users = _load_users_from_disk()

    user = users.get(clean_email)
    if not user:
        return None

    if not _verify_password(password, user.get("password_hash", ""), user.get("salt", "")):
        return None

    safe_profile = dict(user)
    safe_profile.pop("password_hash", None)
    safe_profile.pop("salt", None)
    return safe_profile


def get_user_by_email(email: str) -> Optional[dict]:
    """Retrieve safe user profile by email."""
    users = _load_users_from_disk()
    user = users.get(email.strip().lower())
    if not user:
        return None
    safe_profile = dict(user)
    safe_profile.pop("password_hash", None)
    safe_profile.pop("salt", None)
    return safe_profile


def list_all_users() -> List[dict]:
    """List all registered users (safe profile)."""
    users = _load_users_from_disk()
    safe_list = []
    for u in users.values():
        profile = dict(u)
        profile.pop("password_hash", None)
        profile.pop("salt", None)
        safe_list.append(profile)
    return safe_list
