from pydantic import BaseModel, EmailStr

class SignupRequest(BaseModel):
    nome: str
    email: EmailStr
    senha: str