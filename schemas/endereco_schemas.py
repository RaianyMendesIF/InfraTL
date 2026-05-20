from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class Endereco_schema_cadastro(BaseModel):
    endereco_completo: str
    rua: str
    numero: str
    complemento: Optional[str] = None
    bairro: str
    coordenadas: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    fonte_localizacao: str