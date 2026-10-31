"""Configuration settings for Open Business AI backend."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

# Base directories resolved relative to this file
# config.py is at: <REPO_ROOT>/backend/app/config.py
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
REPO_ROOT = BACKEND_DIR.parent

# Business packs directory at repository root: <REPO_ROOT>/business-packs
_env_packs_dir = os.getenv("BUSINESS_PACKS_DIR")
if _env_packs_dir:
    BUSINESS_PACKS_DIR = Path(_env_packs_dir).resolve()
else:
    BUSINESS_PACKS_DIR = (REPO_ROOT / "business-packs").resolve()

# Application Settings
APP_TITLE = "Open Business AI"
APP_DESCRIPTION = "Open-source AI-powered customer reply assistant for small businesses using Markdown skill packs."
APP_VERSION = "0.1.0"
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

# Server Host & Port
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# AI Model Inference Settings (Ollama / Open-weight models)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gemma4:e2b")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "60.0"))

# CORS Allowed Origins
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
