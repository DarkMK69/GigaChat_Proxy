from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    dialog_id: str = "default"
    stream: bool = False

class ChatResponse(BaseModel):
    response: str
    dialog_id: str

class StreamResponse(BaseModel):
    chunk: str
    done: bool = False