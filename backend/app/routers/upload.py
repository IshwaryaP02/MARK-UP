import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict
from uuid import uuid4

router = APIRouter()

UPLOAD_DIR = "uploads"

# Ensure the upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=Dict[str, str])
async def upload_file(file: UploadFile = File(...)):
    """
    General file upload endpoint for proofs, avatars, and wallpapers.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Generate unique filename to prevent collisions
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    
    # Return the URL path to access the file
    # (Assuming we will mount the 'uploads' directory as a static route in main.py)
    file_url = f"/uploads/{unique_filename}"
    return {"url": file_url}
