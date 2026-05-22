from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, date

class Funcionario_Schema_adicionar(BaseModel):
    id_usuario: int
    matricula: str
    cargo: str
    
    class Config:
        from_attributes = True 
    
class Funcionario_Schema_adicionar_response(BaseModel):
    id_usuario_alteracao: int

    class Config:
        from_attributes = True 

class Funcionario_Schema_remover(BaseModel):
    id_usuario: int
    
    class Config:
        from_attributes = True 
    
class Funcionario_Schema_remover_response(BaseModel):
    id_usuario_alteracao: int

    class Config:
        from_attributes = True 
         