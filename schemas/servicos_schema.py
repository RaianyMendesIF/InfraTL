from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from datetime import datetime
from schemas.endereco_schemas import Endereco_schema_cadastro

class Servico_schema_cadastro(BaseModel):
    nome: str
    descricao: str
    prazo_estimado_dias: int


class Servico_schema_lista(BaseModel):
    id: int
    nome:str
    descricao: str
    prazo_estimado_dias: int
    ativo: bool

    class Config:
        from_attributes = True  

class Servico_schema_editar(BaseModel):
    nome:str
    descricao: str
    prazo_estimado_dias: int
    ativo: bool

