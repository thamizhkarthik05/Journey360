from pymongo import MongoClient
import os
from pathlib import Path
from dotenv import load_dotenv

# Handle .env loading from backend directory
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

mongo_uri = os.getenv("MONGO_URI")

if mongo_uri:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client["journey360"]
    users_collection = db["users"]
    trips_collection = db["trips"]
    itineraries_collection = db["itineraries"]
else:
    # Handle missing config gracefully or let it fail later
    client = None
    db = None
    users_collection = None
    trips_collection = None
    itineraries_collection = None
    print("Warning: MONGO_URI not found in .env")
