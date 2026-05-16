from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from datetime import datetime

class Ocorrencia_schema_cadastro(BaseModel):
    titulo: str
    descricao: str
    id_cidadao: int
    id_servico: int
    id_endereco: int
    urgencia: Optional[Literal["Baixa", "Media", "Alta", "Critica"]] = None

class Ocorrencia_schema_resposta(BaseModel):
    id: int
    titulo: str
    descricao: str
    status: str
    urgencia: Optional[str] = None
    data_abertura: datetime
    id_cidadao: int
    id_servico: int
    id_endereco: int
    model_config = ConfigDict(from_attributes=True)

class Endereco_schema_cadastro(BaseModel):
    rua: str
    numero: str
    complemento: Optional[str] = None
    id_bairro: int
    endereco_completo: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Endereco_schema_resposta(BaseModel):
    id: int
    rua: Optional[str] = None
    numero: Optional[str] = None
    id_bairro: int
    model_config = ConfigDict(from_attributes=True)