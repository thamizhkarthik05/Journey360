import requests
import os
from dotenv import load_dotenv

load_dotenv()

ORS_API_KEY = os.getenv("OPENROUTE_API_KEY")

def get_coordinates(place_name):
    # Hardcoded fallbacks for stability (especially during DNS issues)
    fallbacks = {
        "Chennai": (13.0827, 80.2707),
        "Kerala": (10.8505, 76.2711),
        "Delhi": (28.6139, 77.2090),
        "Mumbai": (19.0760, 72.8777),
        "Bengaluru": (12.9716, 77.5946),
        "Bangalore": (12.9716, 77.5946),
        "Tirupati": (13.6288, 79.4192)
    }
    
    if place_name in fallbacks:
        return fallbacks[place_name]

    url = "https://api.openrouteservice.org/geocode/search"
    params = {
        "text": place_name,
        "api_key": ORS_API_KEY,
        "size": 1
    }
    try:
        # Increase to 30s for slower regional connections
        resp = requests.get(url, params=params, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            if data['features']:
                feature = data['features'][0]
                coords = feature['geometry']['coordinates']
                return coords[1], coords[0] # lat, lon
    except Exception as e:
        print(f"DEBUG: Geocoding Error: {e}")
    
    return None, None

def get_places(destination, interest):
    lat, lon = get_coordinates(destination)
    if lat is None:
        # If we can't geocode the city, we can't find places nearby
        return []

    url = "https://api.openrouteservice.org/geocode/search"
    params = {
        "text": interest,
        "focus.point.lat": lat,
        "focus.point.lon": lon,
        "boundary.circle.radius": 20, # 20km radius
        "size": 20,
        "api_key": ORS_API_KEY
    }
    try:
        # 30s for reliability
        resp = requests.get(url, params=params, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            places = []
            for feature in data.get('features', []):
                props = feature.get('properties', {})
                geom = feature.get('geometry', {})
                places.append({
                    "name": props.get('name', 'Unknown'),
                    "lat": geom.get('coordinates', [0,0])[1],
                    "lng": geom.get('coordinates', [0,0])[0],
                    "address": props.get('label', 'No address')
                })
            return places
    except Exception as e:
        print(f"DEBUG: Places API Error: {e}")

    return []
