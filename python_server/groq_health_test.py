# from fastapi import APIRouter
# from app.groq_service import GroqService

# router = APIRouter()

# groq_service = GroqService()

# @router.get("/groq-health")
# async def groq_health():
#     result = await groq_service.check_health()
#     return result 

from groq import Groq
import os

# Use environment variable instead of hardcoded API key
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("❌ GROQ_API_KEY environment variable not set")
    exit(1)

client = Groq(api_key=api_key)
completion = client.chat.completions.create(
    model="llama3-70b-8192",
    messages=[
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ],
    temperature=1,
    max_completion_tokens=1024,
    top_p=1,
    stream=True,
    stop=None,
)

for chunk in completion:
    print(chunk.choices[0].delta.content or "", end="")
