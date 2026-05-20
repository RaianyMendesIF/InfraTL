from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from datetime import datetime
from schemas.endereco_schemas import Endereco_schema_cadastro

class Ocorrencia_schema_cadastro(BaseModel):
    titulo: str
    descricao: str
    id_usuario: int
    id_servico: int
    endereco: Endereco_schema_cadastro
    urgencia: Optional[Literal["Baixa", "Media", "Alta", "Critica"]] = None

class Ocorrencia_schema_resposta(BaseModel):
    id: int
    titulo: str
    descricao: str
    status: str
    urgencia: Optional[str] = None
    data_abertura: datetime
    id_usuario: int
    id_servico: int
    id_endereco: int
    model_config = ConfigDict(from_attributes=True)
