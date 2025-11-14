from fastapi.security import HTTPBasicCredentials
import secrets


USERS = {
    "admin": "password123",
    "user": "chat123"
}

def authenticate_user(credentials: HTTPBasicCredentials) -> bool:
    correct_password = USERS.get(credentials.username)
    if correct_password is None:
        return False
    
    return secrets.compare_digest(credentials.password, correct_password)