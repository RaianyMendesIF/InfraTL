from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from models.model import TipoUsuario
from datetime import datetime


class Usuario_schema_cadastro(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    tipo_usuario: Optional[TipoUsuario] = TipoUsuario.Cidadao
    ativo: Optional[bool] = True
    tentativas_login: Optional[int] = 0
    bloqueado_ate: Optional[datetime] = None
    
class Usuario_schema_resposta_cadastro(BaseModel):
    id: int
    nome: str
    email: EmailStr
    tipo_usuario: TipoUsuario
    ativo: bool
    criado_em: datetime # Aqui a data gerada pelo banco aparece

    # Essa configuração avisa o Pydantic para ler os dados do objeto do SQLAlchemy
    model_config = ConfigDict(from_attributes=True)