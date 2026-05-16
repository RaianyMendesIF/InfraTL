from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class TesteConexao(BaseModel):
    id: int
    mensagem: str

