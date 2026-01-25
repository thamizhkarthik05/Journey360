import os
from google import genai
from dotenv import load_dotenv
import datetime

load_dotenv()

def chat_with_assistant(user_message, trip_context=None):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return {"reply": "I'm sorry, but my travel brain isn't configured yet! Please check the API settings."}

    try:
        # Initialize the modern GenAI client
        client = genai.Client(api_key=gemini_key)
        
        system_prompt = "You are Journey360 AI, a helpful and knowledgeable travel assistant. "
        if trip_context:
            system_prompt += f"Context: The user is planning a trip to {trip_context.get('destination', 'their destination')} "
            system_prompt += f"with a budget of {trip_context.get('budget', 'unknown')} and interests in {trip_context.get('interests', 'various things')}. "
        
        system_prompt += "Provide concise, helpful, and friendly advice."

        # Combine system prompt and user message
        full_prompt = f"{system_prompt}\n\nUser: {user_message}"
        
        # Use a valid model name (gemini-2.0-flash is current best performance/speed)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=full_prompt
        )
        
        if response.text:
            return {"reply": response.text.strip()}
    except Exception as e:
        print(f"Assistant Gemini Error: {type(e).__name__}: {e}")

        try:
            with open("gemini_error.log", "a") as f:
                f.write(f"{datetime.datetime.now()}: {type(e).__name__}: {e}\n")
        except:
            pass

    return {"reply": "I'm having trouble connecting to my travel brain right now. It might be a model configuration issue or API quota. Please try again."}
