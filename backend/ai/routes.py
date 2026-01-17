from fastapi import APIRouter, Depends, HTTPException
try:
    from backend.database.db import trips_collection, itineraries_collection
    from backend.ai.itinerary import generate_itinerary
    from backend.ai.regeneration import regenerate_itinerary
    from backend.ai.assistant import chat_with_assistant
    from backend.ai.post_trip import generate_trip_summary
    from backend.ai.safety import assess_safety
    from backend.auth.dependencies import get_current_user
    from backend.utils.geo import haversine
except ImportError:
    from database.db import trips_collection, itineraries_collection
    from ai.itinerary import generate_itinerary
    from ai.regeneration import regenerate_itinerary
    from ai.assistant import chat_with_assistant
    from ai.post_trip import generate_trip_summary
    from ai.safety import assess_safety
    from auth.dependencies import get_current_user
    from utils.geo import haversine

router = APIRouter()

@router.get("/ai/itinerary/ar-nearby")
def get_ar_nearby(trip_id: str, lat: float, lng: float, radius: float = 1000, user=Depends(get_current_user)):
    # Verify trip ownership
    trip = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    itinerary = itineraries_collection.find_one({"tripId": trip_id})
    if not itinerary:
        return []

    nearby_places = []
    for day in itinerary.get("days", []):
        for place in day.get("places", []):
            # We assume place data from the LLM has lat/lng if we enrich it or 
            # we use the search service to get coordinates if missing.
            # For this MVP, we'll try to find lat/lng in the place object
            p_lat = place.get("lat")
            p_lng = place.get("lng")
            
            if p_lat and p_lng:
                dist = haversine(lat, lng, p_lat, p_lng)
                if dist <= radius:
                    nearby_places.append({
                        **place,
                        "distance": round(dist, 1)
                    })
    
    return nearby_places

@router.post("/ai/itinerary/generate")
def generate(trip_id: str, user=Depends(get_current_user)):
    trip = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    try:
        itinerary = generate_itinerary(trip)
        return itinerary
    except Exception as e:
        err_msg = str(e)
        if "Quota exceeded" in err_msg or "429" in err_msg:
            raise HTTPException(status_code=503, detail="AI is currently at capacity. Please try again in 30 seconds.")
        raise HTTPException(status_code=500, detail=f"Itinerary generation failed: {err_msg}")

@router.get("/trip/{trip_id}/itinerary")
def get_itinerary(trip_id: str, user=Depends(get_current_user)):
    # Check trip ownership
    trip = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found or not authorized")
    
    itinerary = itineraries_collection.find_one({"tripId": trip_id})
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not generated yet")
    
    if "_id" in itinerary: del itinerary["_id"]
    return itinerary

@router.post("/ai/itinerary/regenerate")
def regenerate(data: dict, user=Depends(get_current_user)):
    trip_id = data.get("tripId")
    instruction = data.get("instruction")
    constraints = data.get("constraints", {})
    
    if not trip_id or not instruction:
        raise HTTPException(status_code=400, detail="tripId and instruction are required")
        
    trip = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    existing_itinerary = itineraries_collection.find_one({"tripId": trip_id})
    if not existing_itinerary:
        raise HTTPException(status_code=404, detail="No existing itinerary to regenerate")
        
    try:
        updated_itinerary = regenerate_itinerary(trip, existing_itinerary, instruction, constraints)
        return {"message": "Itinerary updated successfully", "updatedItinerary": updated_itinerary}
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "ResourceExhausted" in err_msg:
            raise HTTPException(status_code=503, detail="AI is currently at capacity. Please try again in 30 seconds.")
        raise HTTPException(status_code=500, detail=f"Regeneration failed: {err_msg}")

@router.post("/ai/chat")
def chat(message: str, trip_id: str = None, user=Depends(get_current_user)):
    trip_context = None
    if trip_id:
        trip_context = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    
    return chat_with_assistant(message, trip_context)

@router.post("/ai/post-trip/summary")
def summary(trip_id: str, user=Depends(get_current_user)):
    trip = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return generate_trip_summary(trip)

@router.post("/ai/safety/assess")
def safety(location: str, user=Depends(get_current_user)):
    return assess_safety(location)
