from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey
from sqlalchemy.orm import declarative_base

Base = declarative_base()



class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String)
    email = Column("email", String, nullable=False)
    senha = Column("senha", String, nullable=False)
    ativo = Column("ativo", Boolean)
    admin = Column("admin", Boolean, default=False)
    
    def __init__(self, nome, email, senha, ativo=True, admin=False):
        self.nome = nome
        self.email = email
        self.senha = senha
        self.ativo = ativo
        self.admin = admin
        
class Endereco(Base):
    __tablename__ = "endereco"
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    rua = Column("rua", String, nullable=False)
    bairro = Column("bairro", ForeignKey("bairro.id"), nullable=False)
    


class Bairro(Base):
    __tablename__ = "bairro"
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String, nullable=False)
    
