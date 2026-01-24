import os
import google.generativeai as genai
from dotenv import load_dotenv
import datetime

load_dotenv()

def chat_with_assistant(user_message, trip_context=None):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return {"reply": "I'm sorry, but my travel brain isn't configured yet! Please check the API settings."}

    # Configure the legacy SDK
    genai.configure(api_key=gemini_key)
    
    system_prompt = "You are Journey360 AI, a helpful and knowledgeable travel assistant. "
    if trip_context:
        system_prompt += f"Context: The user is planning a trip to {trip_context.get('destination', 'their destination')} "
        system_prompt += f"with a budget of {trip_context.get('budget', 'unknown')} and interests in {trip_context.get('interests', 'various things')}. "
    
    system_prompt += "Provide concise, helpful, and friendly advice."

    try:
        # Use the GenerativeModel class from the legacy SDK which is more robust for simple text
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Combine system prompt and user message
        full_prompt = f"{system_prompt}\n\nUser: {user_message}"
        
        response = model.generate_content(full_prompt)
        
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
