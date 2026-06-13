from pydantic import BaseModel

class Bairro_schema(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True  # No Pydantic v1 era: orm_mode = True