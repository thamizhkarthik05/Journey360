from fastapi import APIRouter, Query
from services.news_service import get_safety_news
from services.risk_engine import calculate_risk
from services.emergency_service import get_emergency_numbers

router = APIRouter(prefix="/ai/safety", tags=["Safety"])

@router.get("/risk")
def assess_safety(location: str = Query(...)):
    news = get_safety_news(location)
    risk = calculate_risk(news)

    alerts = [
        n for n in news if n["severity"] == "High"
    ]

    return {
        "location": location,
        "risk": risk,
        "news": news,              # EXACTLY 5
        "alerts": alerts,          # High severity only
        "emergency": get_emergency_numbers(location),
        "ai_insight": (
            f"{risk['level']} risk detected based on "
            f"{len(alerts)} high-severity incidents in the last 48 hours."
        )
    }
