import firebase_admin
from firebase_admin import credentials, auth
from app.core.config import settings
import json
import os

_firebase_app = None


def get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    if settings.DEV_MODE or not settings.FIREBASE_CREDENTIALS_JSON:
        return None

    try:
        cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
        cred = credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception:
        return None


def verify_firebase_token(id_token: str) -> dict | None:
    app = get_firebase_app()
    if app is None:
        return None
    try:
        decoded = auth.verify_id_token(id_token, app)
        return decoded
    except Exception:
        return None
