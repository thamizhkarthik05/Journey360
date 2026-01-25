from fastapi import APIRouter, Depends, HTTPException, Query
from backend.auth.dependencies import get_current_user
from backend.database.db import saved_places_collection
from backend.saved_places.models import SavedPlace
from typing import List
import uuid
from datetime import datetime

router = APIRouter(prefix="/saved-places", tags=["Saved Places"])

@router.get("/", response_model=List[SavedPlace])
async def get_saved_places(user=Depends(get_current_user)):
    if saved_places_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    cursor = saved_places_collection.find({"user_id": user["uid"]})
    places = []
    for doc in cursor:
        doc.pop("_id", None)
        places.append(doc)
    
    return places

@router.post("/", response_model=SavedPlace)
async def save_place(place: SavedPlace, user=Depends(get_current_user)):
    if saved_places_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Ensure the user_id matches the authenticated user
    place_dict = place.dict(by_alias=True)
    place_dict["user_id"] = user["uid"]
    place_dict["uid"] = user["uid"] # Legacy/Redundancy check if needed, but schema uses user_id
    
    # Check if already exists to avoid duplicates (optional, based on place_id)
    existing = saved_places_collection.find_one({"user_id": user["uid"], "place_id": place.place_id})
    if existing:
        return existing

    saved_places_collection.insert_one(place_dict)
    place_dict.pop("_id", None)
    return place_dict

@router.delete("/{place_id}")
async def remove_saved_place(place_id: str, user=Depends(get_current_user)):
    if saved_places_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    result = saved_places_collection.delete_one({"user_id": user["uid"], "place_id": place_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Place not found")
        
    return {"message": "Place removed successfully"}

@router.get("/check/{place_id}")
async def check_is_saved(place_id: str, user=Depends(get_current_user)):
    if saved_places_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    existing = saved_places_collection.find_one({"user_id": user["uid"], "place_id": place_id})
    return {"is_saved": bool(existing)}
