from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class Usuario_schema_cadastro(BaseModel):
    nome: str
    cpf: str
    telefone: str
    data_nascimento: str
    email: EmailStr
    senha: str
    
class Usuario_schema_resposta_cadastro(BaseModel):
    id: int
    nome: str
    email: EmailStr
    ativo: bool
    criado_em: datetime # Aqui a data gerada pelo banco aparece

    # Essa configuração avisa o Pydantic para ler os dados do objeto do SQLAlchemy
    model_config = ConfigDict(from_attributes=True)