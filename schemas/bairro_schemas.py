from pydantic import BaseModel

class Bairro_schema_lista(BaseModel):
    id: int
    nome: str
    regiao: str | None

    class Config:
        from_attributes = True  

class Bairro_schema_cadastro(BaseModel):
    nome: str
    regiao: str | None

class Bairro_schema_editar(BaseModel):
    nome: str
    regiao: str | None