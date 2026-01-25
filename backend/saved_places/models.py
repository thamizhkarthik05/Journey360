from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SavedPlace(BaseModel):
    place_id: str = Field(alias="placeId")
    name: str
    address: Optional[str] = None
    category: Optional[str] = None  # e.g., "Restaurant", "Hotel", "Attraction"
    rating: Optional[float] = None
    image: Optional[str] = None
    notes: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    saved_at: datetime = Field(default_factory=datetime.utcnow, alias="savedAt")
    user_id: Optional[str] = Field(default=None, alias="userId")

    class Config:
        populate_by_name = True
