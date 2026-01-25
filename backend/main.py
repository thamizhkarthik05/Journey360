import sys
import os
from pathlib import Path

# Add the project root (parent of 'backend') to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))
# Also add current dir to handle local imports
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

try:
    from backend.auth.dependencies import get_current_user
    from backend.database.db import users_collection
except ImportError:
    from auth.dependencies import get_current_user
    from database.db import users_collection

app = FastAPI(title="Journey360 Backend")

# Enable CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Journey360 backend is running"}

@app.get("/debug/config")
def debug_config():
    return {
        "MOCK_AI": os.getenv("MOCK_AI"),
        "OFFLINE_MODE": os.getenv("OFFLINE_MODE"),
        "HAS_OPENROUTER_KEY": bool(os.getenv("OPENROUTER_API_KEY")),
        "VERSION": "2.2.3",
        "PYTHONPATH": sys.path
    }

@app.get("/test-auth")
def test_auth(user=Depends(get_current_user)):
    # Save user to MongoDB
    if users_collection is not None:
        user_data = {
            "uid": user["uid"],
            "email": user["email"],
            "last_login": datetime.utcnow()
        }
        users_collection.update_one(
            {"uid": user["uid"]},
            {"$set": user_data},
            upsert=True
        )
        return {"message": "Authenticated & Saved to DB!", "user": user}
    
    return {"message": "Authenticated but DB not connected", "user": user}

try:
    from backend.trips.routes import router as trips_router
    from backend.ai.routes import router as ai_router
    from backend.users.routes import router as users_router
    from backend.saved_places.routes import router as saved_places_router
except ImportError:
    from trips.routes import router as trips_router
    from ai.routes import router as ai_router
    from users.routes import router as users_router
    from saved_places.routes import router as saved_places_router

app.include_router(trips_router, tags=["Trips"])
app.include_router(ai_router, tags=["AI"])
app.include_router(users_router, tags=["Users"])
app.include_router(saved_places_router, tags=["Saved Places"])
from backend.services.news_service import get_safety_news
from fastapi import Query
@app.get("/ai/safety/risk")
def safety_risk(location: str = Query(...)):
    city = location
    country = ""
    if "," in location:
        parts = location.split(",", 1)
        city = parts[0].strip()
        country = parts[1].strip()
    
    articles = get_safety_news(city, country)
    return {"location": location, "articles": articles}

