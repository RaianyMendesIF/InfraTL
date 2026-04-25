from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey
from sqlalchemy.orm import declarative_base
from sqlalchemy_utils.types import ChoiceType

Base = declarative_base()



class Usuario(Base):
    __tablename__ = "usuario"
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String)
    email = Column("email", String, nullable=False)
    senha = Column("senha", String, nullable=False)
    ativo = Column("ativo", Boolean)
    admin = Column("admin", Boolean, default=False)
    
    tipo = Column(String)
    
    __mapper_args__ = {
        "polymorphic_identity": "usuario",
        "polymorphic_on": tipo
    }
    
    def __init__(self, nome, email, senha, ativo=True, admin=False):
        self.nome = nome
        self.email = email
        self.senha = senha
        self.ativo = ativo
        self.admin = admin
        
        
        
        

class Cidadao(Usuario):
    __tablename__ = "cidadao"
    
    id = Column("id", Integer, ForeignKey("usuario.id"), primary_key=True)  
    
    __mapper_args__ = {
        "polymorphic_identity": "cidadao",
    }
    
    
    
    
    
class Funcionario(Usuario):
    __tablename__ = "funcionario"
    
    id = Column("id", Integer, ForeignKey("usuario.id"), primary_key=True)  
    matricula = Column("matricula", String, nullable=False)
    cargo = Column("cargo", String)
    
    __mapper_args__ = {
        "polymorphic_identity": "funcionario",
    }
    
    
    
          
        
class Endereco(Base):
    __tablename__ = "endereco"
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    cep = Column("cep", String, nullable=False)
    bairro = Column("bairro", ForeignKey("bairro.id"), nullable=False)
    rua = Column("rua", String, nullable=False)
    numero = Column("numero", Integer)
    complemento = Column("complemento", String, default=None)
    
    def __init__(self, cep, bairro, rua, numero, complemento = None):
        self.cep = cep
        self.bairro = bairro
        self.rua = rua
        self.numero = numero
        self.complemento = complemento
        



class Bairro(Base):
    __tablename__ = "bairro"
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String, nullable=False)
    
    def __init__(self, nome):
        self.nome = nome
   
   
   
        
class Ocorrencia(Base):
    __tablename__ = "ocorrencia"
    
    STATUS_PEDIDOS = (
        ("PENDENTE", "PENDENTE")
        ("EM ANDAMENTO", "EM ANDAMENTO")
        ("FINALIZADO", "FINALIZADO")
        ("CANCELADO", "CANCELADO")
    )
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    titulo = Column("titulo", String, nullable=False)
    descricao = Column("descricao", String, nullable=False)
    status = Column("status", ChoiceType(choices=STATUS_PEDIDOS))
    urgencia = Column("urgencia", Boolean, default=False)
    id_cidadao = Column("cidadao", ForeignKey("cidadao.id"))
    id_funcionario = Column("funcionario", ForeignKey("funcionario.id"))
    id_endereco = Column("endereco", ForeignKey("endereco.id"))
    
    def __init__(self, titulo, descricao, urgencia, id_cidadao, id_funcionario, id_endereco, status="PENDENTE"):
        self.titulo = titulo
        self.descricao = descricao
        self.status = status
        self.urgencia = urgencia
        self.id_cidadao = id_cidadao
        self.id_funcionario = id_funcionario
        self.id_endereco = id_endereco
    
