from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from datetime import datetime
from schemas.endereco_schemas import Endereco_schema_cadastro

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
