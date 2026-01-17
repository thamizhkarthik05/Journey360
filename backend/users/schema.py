from pydantic import BaseModel
from datetime import datetime

class User(BaseModel):
    uid: str
    email: str
    name: str | None = None
    created_at: datetime = datetime.utcnow()
