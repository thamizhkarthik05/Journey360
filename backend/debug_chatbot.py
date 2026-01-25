import os
import sys
try:
    from backend.ai.assistant import chat_with_assistant
except ImportError:
    import sys
    sys.path.append(os.getcwd())
    from backend.ai.assistant import chat_with_assistant

import os
from google import genai
from dotenv import load_dotenv
import traceback

load_dotenv()

def log(msg):
    with open("chatbot_log.txt", "a", encoding="utf-8") as f:
        f.write(str(msg) + "\n")
    print(msg)

with open("chatbot_log.txt", "w") as f: f.write("Starting Log\n")

log("DEBUG: Testing Chatbot Exception")
# try:
#     client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
#     response = client.models.generate_content(
#         model='gemini-2.0-flash',
#         contents="Hello"
#     )
#     log(f"Direct Gemini Call: {response.text}")
# except Exception as e:
#     log("Direct Gemini Call Failed:")
#     # Capture trace
#     import io
#     s = io.StringIO()
#     traceback.print_exc(file=s)
#     log(s.getvalue())

log("Calling assistant function:")
res = chat_with_assistant("Hello")
log(res)
