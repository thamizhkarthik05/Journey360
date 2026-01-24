import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Testing with key: {api_key[:10]}...")

client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    for model in client.models.list():
        print(f"Model: {model.name}, Supported Actions: {model.supported_generation_methods}")
except Exception as e:
    print(f"Error: {e}")
