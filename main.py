from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import requests
import os

app = FastAPI()

# CORS (allow React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_URL = "https://aicafe.hcl.com/AICafeService/api/v1/subscription/openai/deployments/gpt-4.1/chat/completions?api-version=2024-12-01-preview"

API_KEY = os.getenv("API_KEY")


# Message schema
class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        print("Incoming messages:", req.messages)

        response = requests.post(
            API_URL,
            headers={
                "api-key": API_KEY,  # ✅ FIXED
                "Content-Type": "application/json"
            },
            json={
                "messages": [msg.model_dump() for msg in req.messages],
                "stream": True
            }
        )

        print("API status:", response.status_code)
        print("API response:", response.text)

        return {"reply": response.json()}

    except Exception as e:
        print("ERROR:", str(e))
        return {"error": str(e)}