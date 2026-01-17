from fastapi import Header, HTTPException
from backend.auth.firebase import verify_token

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.split(" ")[1]
    print(f"DEBUG AUTH: Received token starting with {token[:10]}...", flush=True)

    try:
        decoded = verify_token(token)
        print(f"DEBUG AUTH: Verification success for user {decoded.get('email')}", flush=True)
        return decoded
    except Exception as e:
        print(f"DEBUG AUTH: Verification failed: {str(e)}", flush=True)
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
