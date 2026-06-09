from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from groq import Groq
import os
from dotenv import load_dotenv

# load .env into environment
load_dotenv()

app = FastAPI()

# CORS (allow React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("API_KEY")

# SAFE startup diagnostic (do not print the key)
print("API key loaded:", bool(API_KEY))

# Groq client (created after loading env)
client = Groq(api_key=API_KEY)


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

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[msg.model_dump() for msg in req.messages],
        )

        print("API response:", response)

        return {"reply": response}

    except Exception as e:
        print("ERROR:", str(e))
        return {"error": str(e)}