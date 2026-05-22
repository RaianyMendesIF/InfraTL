from pydantic import BaseModel, EmailStr, ConfigDict, model_validator
from typing import Optional
from datetime import datetime, date
from schemas.endereco_schemas import Endereco_schema_cadastro


class Usuario_schema_cadastro(BaseModel):
    nome: str
    cpf: str
    telefone: str
    data_nascimento: date
    email: EmailStr
    senha: str
    endereco: Endereco_schema_cadastro

    class Config:
        from_attributes = True
        
class Usuario_response(BaseModel):
    id: int
    nome: str
    cpf: str
    telefone: str
    data_nascimento: date
    email: str
    id_endereco: int
    # endereco: Endereco_schema_cadastro
    tipo_usuario: str
    ativo: bool

    class Config:
        from_attributes = True

class Usuario_recuperar_senha(BaseModel):
    email: EmailStr

class Usuario_redefinir_senha(BaseModel):
    nova_senha: str
    confirmar_senha: str 

    @model_validator(mode='after')
    def verificar_senhas_iguais(self):
        if self.nova_senha != self.confirmar_senha:
            raise ValueError("As senhas informadas não coincidem.")
        return self

class Login_schema(BaseModel):
    email: EmailStr
    senha: str

class Token_response(BaseModel):
    access_token: str
    token_type: str
    usuario: Usuario_response
