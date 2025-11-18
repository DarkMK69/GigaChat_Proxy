from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import StreamingResponse
import uvicorn
import os
from dotenv import load_dotenv

from .auth import authenticate_user
from .models import ChatRequest
from .giga_chat import GigaChatProxy

load_dotenv()

app = FastAPI(title="Chat Proxy API", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000", "tauri://localhost", "http://localhost:4173" ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBasic()
giga_chat = GigaChatProxy(api_key=os.getenv("GIGACHAT_API_KEY"))

@app.get("/")
async def root(credentials: HTTPBasicCredentials = Depends(security)):
    user = authenticate_user(credentials)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return {"message": "Chat Proxy API", "user": credentials.username}

@app.post("/request")
async def chat_request(
    request: ChatRequest,
    credentials: HTTPBasicCredentials = Depends(security)
):
    user = authenticate_user(credentials)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    if request.stream:
        return StreamingResponse(
            giga_chat.send_message_stream(request.message),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
    else:
        return await giga_chat.send_message(request.message)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)