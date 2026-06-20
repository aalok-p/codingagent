from pydantic import BaseModel, EmailStr, field_validator


class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    role: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        if v not in ("buyer", "seller"):
            raise ValueError("Role must be 'buyer' or 'seller'")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
