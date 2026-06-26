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
    

class Avaliar_ocorrencia_schema(BaseModel):
    aprovado: bool
    justificativa: Optional[str] = None
    urgencia: Optional[Literal["Baixa", "Media", "Alta", "Critica"]] = None


class Ocorrencia_schema_listar(BaseModel):
    bairro: Optional[str] = None
    tipo: Optional[str] = None
    status: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
    
class Mudar_status_ocorrencia_schema(BaseModel):
    status: Literal["Em_Execucao", "Finalizado"]
    observacao_tecnica: Optional[str] = None