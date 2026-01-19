from pydantic import BaseModel
from datetime import datetime

class User(BaseModel):
    uid: str
    email: str
    name: str | None = None
    phone: str | None = None
    bio: str | None = None
    dob: str | None = None
    preferences: dict | None = None
    two_factor_enabled: bool = False
    two_factor_secret: str | None = None
    created_at: datetime = datetime.utcnow()
