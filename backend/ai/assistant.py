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
        
        # Retry logic for 429 Resource Exhausted
        import time
        # Tactic: Match Itinerary Generator models which are known to work.
        models_to_try = ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-2.0-flash']
        
        # Increase initial delay to handle 11s+ wait times better
        retry_delay = 5
        max_retries = 5
        
        for model_name in models_to_try:
            for attempt in range(max_retries):
                try:
                    print(f"DEBUG: Chatbot attempting model {model_name} (Attempt {attempt+1})")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=full_prompt
                    )
                    
                    if response.text:
                        return {"reply": response.text.strip()}
                except Exception as e:
                    err_str = str(e)
                    
                    # Handle Not Found (Invalid Model Name) -> Switch Model Immediately
                    if "404" in err_str or "NOT_FOUND" in err_str:
                        print(f"DEBUG: Model {model_name} not found (404). Switching to next model...")
                        break # Break inner loop to try next model
                        
                    # Handle Rate Limit -> Wait and Retry same model
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        if attempt < max_retries - 1:
                            print(f"Assistant Rate Limit (429) on {model_name}. Retrying in {retry_delay}s...")
                            time.sleep(retry_delay)
                            retry_delay *= 2
                            continue
                    
                    # If other error, or max retries reached for 429, try next model?
                    # Generally if 429 persists, switching model might help if quota is per-model (unlikely for free tier, but possible)
                    # Let's verify if we should break or raise. 
                    # If we exhausted retries on this model, maybe try next model as last resort.
                    if attempt == max_retries - 1:
                         print(f"DEBUG: Max retries reached for {model_name}. Trying next model...")
                         break
                         
                    # For other unexpected errors, log and break to next model
                    print(f"DEBUG: Error {err_str} on {model_name}. Trying next...")
                    break
        
        # If we exit loops without returning
        raise Exception("All models failed.")
    except Exception as e:
        print(f"Assistant Gemini Error: {type(e).__name__}: {e}")

        try:
            with open("gemini_error.log", "a") as f:
                f.write(f"{datetime.datetime.now()}: {type(e).__name__}: {e}\n")
        except:
            pass

    return {"reply": "I'm having trouble connecting to my travel brain right now. It might be a model configuration issue or API quota. Please try again."}
