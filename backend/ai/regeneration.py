import json
import os
import requests
import uuid
from datetime import datetime
try:
    from backend.database.db import itineraries_collection
    from backend.ai.itinerary import calculate_costs, get_mock_itinerary, call_llm
    from backend.trips.schema import Itinerary
except ImportError:
    from database.db import itineraries_collection
    from ai.itinerary import (
        calculate_costs, get_mock_itinerary, call_llm, 
        DEFAULT_CURRENCY_SYMBOL, DEFAULT_CURRENCY_CODE
    )
    from trips.schema import Itinerary

def build_regeneration_prompt(trip, current_itinerary, instruction, constraints):
    itinerary_days_json = json.dumps(current_itinerary.get("days", []), indent=2)
    top_hotels_json = json.dumps(current_itinerary.get("topHotels", []), indent=2)
    
    return f"""
You are 'Journey360 AI', an expert travel consultant.
You are helping a user modify their existing itinerary for {trip['destination']}.

Current Itinerary Days:
{itinerary_days_json}

Available Recommended Hotels (for selection):
{top_hotels_json}

User Instruction: {instruction}
Additional Constraints: {constraints}

Task: Modify the existing itinerary based on the user's instruction.
Rules:
1. Preserve as much of the original structure as possible.
2. ONLY update parts that need changing to satisfy the instruction.
3. Keep the JSON structure identical to the input.
4. Ensure costs are updated if activities change.
5. HOTELS: If the user wants to change the hotel, strictly use one from the 'Available Recommended Hotels' list.
6. Strictly return JSON only.

JSON Structure:
{{
  "topHotels": [
    {{
      "name": "string",
      "rating": number,
      "vibe": "string",
      "description": "string",
      "price": "string",
      "bookingUrl": "string",
      "lat": number,
      "lng": number
    }}
  ],
  "days": [
    {{
      "dayNumber": 1,
      "weatherNote": "string",
      "places": [
        {{
          "name": "string",
          "category": "attraction" | "food" | "hotel",
          "estimatedCost": number,
          "timeSlot": "breakfast" | "morning" | "lunch" | "afternoon" | "dinner" | "evening",
          "duration": "string"
        }}
      ]
    }}
  ]
}}
"""

def regenerate_itinerary(trip, existing_itinerary, instruction, constraints):
    print(f"\nSTARTING ITINERARY REGENERATION for {trip['destination']}", flush=True)
    
    prompt = build_regeneration_prompt(trip, existing_itinerary, instruction, constraints)
    
    raw_itinerary = call_llm(prompt, trip)
    
    if not raw_itinerary:
        print("ERROR: LLM returned None. Falling back to existing itinerary structure.")
        raw_itinerary = existing_itinerary
    
    # Recalculate costs
    cost_summary = calculate_costs(raw_itinerary.get("days", []), currency_symbol=DEFAULT_CURRENCY_SYMBOL)
    
    raw_days = raw_itinerary.get("days", [])
    if not raw_days:
        raw_days = existing_itinerary.get("days", [])
        
    updated_itinerary = {
        "days": raw_days,
        "topHotels": raw_itinerary.get("topHotels", existing_itinerary.get("topHotels", [])),
        "safetyAdvisory": raw_itinerary.get("safetyAdvisory", existing_itinerary.get("safetyAdvisory", "Standard precautions.")),
        "travelTips": raw_itinerary.get("travelTips", existing_itinerary.get("travelTips", [])),
        "costSummary": cost_summary,
        "currencySymbol": DEFAULT_CURRENCY_SYMBOL,
        "currencyCode": DEFAULT_CURRENCY_CODE,
        "generatedFrom": "regenerate",
        "lastPromptUsed": prompt,
        "updatedAt": datetime.utcnow()
    }
    
    # Update in DB
    if itineraries_collection is not None:
        itineraries_collection.update_one(
            {"itineraryId": existing_itinerary["itineraryId"]},
            {"$set": updated_itinerary}
        )
    
    # Fetch full updated document
    itinerary = itineraries_collection.find_one({"itineraryId": existing_itinerary["itineraryId"]})
    if itinerary and "_id" in itinerary: del itinerary["_id"]
    
    # Convert datetimes to strings for JSON serialization
    if itinerary:
        if "createdAt" in itinerary and isinstance(itinerary["createdAt"], datetime):
            itinerary["createdAt"] = itinerary["createdAt"].isoformat()
        if "updatedAt" in itinerary and isinstance(itinerary["updatedAt"], datetime):
            itinerary["updatedAt"] = itinerary["updatedAt"].isoformat()
    
    print(f"COMPLETED ITINERARY REGENERATION\n", flush=True)
    return itinerary
