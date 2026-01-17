import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def assess_safety(location, weather_data=None):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return {"level": "Unknown", "advice": "Gemini API key not configured."}

    prompt = f"Analyze the safety and travel risks for {location}."
    if weather_data:
        prompt += f" Current weather context: {weather_data}."
    
    prompt += " Provide a safety level (Low/Medium/High Risk) and brief advice. Return as RAW JSON: {\"level\": \"...\", \"advice\": \"...\"}"

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="You are a travel safety expert. Provide specific, actionable safety advice. Respond with RAW JSON only."
            )
        )
        
        if response.text:
            return json.loads(response.text.strip())
    except Exception as e:
        print(f"Safety Gemini Error: {e}")

    return {"level": "Unknown", "advice": "Safety data temporarily unavailable. Please exercise standard caution."}

    return {"level": "Unknown", "advice": "Safety data temporarily unavailable. Please exercise standard caution."}
