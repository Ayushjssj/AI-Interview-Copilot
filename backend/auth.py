from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from bson import ObjectId
import hashlib
import os

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super_secret_key_123")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__truncate_error=False,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def prepare_password(password: str):
    hashed = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return hashed[:72]


def hash_password(password: str):
    safe_password = prepare_password(password)
    return pwd_context.hash(safe_password)


def verify_password(plain_password: str, hashed_password: str):
    safe_password = prepare_password(plain_password)
    return pwd_context.verify(safe_password, hashed_password)


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )


async def get_current_user(token: str = Depends(oauth2_scheme)):
    from main import users_collection

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        user = await users_collection.find_one(
            {"_id": ObjectId(user_id)}
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        return {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )