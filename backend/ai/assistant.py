import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def chat_with_assistant(user_message, trip_context=None):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return {"reply": "I'm sorry, but my travel brain isn't configured yet! Please check the API settings."}

    system_prompt = "You are Journey360 AI, a helpful and knowledgeable travel assistant. "
    if trip_context:
        system_prompt += f"Context: The user is planning a trip to {trip_context.get('destination', 'their destination')} "
        system_prompt += f"with a budget of {trip_context.get('budget', 'unknown')} and interests in {trip_context.get('interests', 'various things')}. "
    
    system_prompt += "Provide concise, helpful, and friendly advice."

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        
        if response.text:
            return {"reply": response.text.strip()}
    except Exception as e:
        print(f"Assistant Gemini Error: {e}")

    return {"reply": "I'm having trouble connecting to my travel brain right now. Please try again in a moment!"}

    return {"reply": "I'm having trouble connecting to my travel brain right now. Please try again in a moment!"}

    return {"reply": "I'm having trouble connecting to my travel brain right now. Please try again in a moment!"}
