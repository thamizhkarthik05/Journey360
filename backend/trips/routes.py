from fastapi import APIRouter, Depends, HTTPException
import uuid
from datetime import datetime
try:
    from backend.database.db import trips_collection
    from backend.auth.dependencies import get_current_user
    from backend.trips.schema import Trip
except ImportError:
    from database.db import trips_collection
    from auth.dependencies import get_current_user
    from trips.schema import Trip

router = APIRouter()

@router.post("/trip/create")
def create_trip(data: dict, user=Depends(get_current_user)):
    if trips_collection is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    trip_id = str(uuid.uuid4())
    
    # Calculate days from dates if provided
    days = 3
    if "start_date" in data and "end_date" in data:
        try:
            d1 = datetime.strptime(data["start_date"], "%Y-%m-%d")
            d2 = datetime.strptime(data["end_date"], "%Y-%m-%d")
            days = (d2 - d1).days + 1
            if days <= 0: days = 1
        except Exception:
            days = 3

    # Sanitizer: Fix common misspellings
    dest_name = data["destination"].replace("Kolkatta", "Kolkata").replace("Banglore", "Bengaluru")

    trip = {
        "trip_id": trip_id,
        "user_id": user["uid"],
        "destination": dest_name,
        "start_date": data.get("start_date"),
        "end_date": data.get("end_date"),
        "days": days,
        "budget": data["budget"],
        "interests": data["interests"],
        "travel_pace": data.get("travel_pace", "Balanced"),
        "status": "CREATED"
    }
    trips_collection.insert_one(trip)
    trip["_id"] = str(trip["_id"])
    return trip

@router.get("/trips")
def list_trips(user=Depends(get_current_user)):
    print(f"DEBUG: Fetching trips for user {user['uid']}", flush=True)
    if trips_collection is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    trips = list(trips_collection.find({"user_id": user["uid"]}).sort("_id", -1))
    for trip in trips:
        trip["_id"] = str(trip["_id"])
    return trips
