import requests
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

NEWS_KEYWORDS = [
    "crime", "protest", "riot", "flood",
    "fire", "accident", "earthquake", "alert"
]

SEVERITY_MAP = {
    "earthquake": "High",
    "riot": "High",
    "flood": "High",
    "fire": "Medium",
    "protest": "Medium",
    "crime": "Medium",
    "accident": "Low",
    "alert": "Low"
}

def detect_severity(text: str) -> str:
    text = text.lower()
    for keyword, level in SEVERITY_MAP.items():
        if keyword in text:
            return level
    return "Low"

def get_safety_news(location: str, limit=5):
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        raise RuntimeError("NEWS_API_KEY missing")

    from_date = (datetime.utcnow() - timedelta(days=5)).strftime("%Y-%m-%d")

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": f'"{location}"',
        "from": from_date,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 20,
        "apiKey": api_key
    }

    try:
        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()  # ✅ will raise HTTPError for 4xx/5xx
        data = res.json()
    except requests.exceptions.RequestException as e:
        print(f"NewsAPI request failed: {e}")
        return []

    articles = []

    for entry in data.get("articles", []):
        title = entry.get("title", "")
        desc = entry.get("description") or ""
        severity = detect_severity(f"{title} {desc}")

        articles.append({
            "title": title,
            "source": entry.get("source", {}).get("name", "News"),
            "link": entry.get("url"),
            "published": entry.get("publishedAt", "").split("T")[0],
            "severity": severity,
            "summary": desc
        })

    if not articles:
        print(f"No articles found for location: {location}")

    return articles[:limit]
