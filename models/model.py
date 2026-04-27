from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey, DateTime, Date, Enum
from sqlalchemy.orm import declarative_base
from sqlalchemy_utils.types import ChoiceType
from datetime import datetime
from passlib.context import CryptContext


Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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
        self.senha = pwd_context.hash(senha)
        self.ativo = ativo
        self.admin = admin
        
        
    def verificar_senha(self, senha_pura):
        """Método útil para validar a senha durante o login.
        Adicionei esse método porque, uma vez que a senha é hasheada,
        você não consegue mais ler o valor original. Para logar o usuário depois,
        você precisará usar o pwd_context.verify
        """
        return pwd_context.verify(senha_pura, self.senha)
        
        
        
        

class Cidadao(Usuario):
    __tablename__ = "cidadao"
    
    id = Column("id", Integer, ForeignKey("usuario.id"), primary_key=True)
    cpf = Column('cpf', String(11), nullable=False, unique=True)
    telefone = Column('telefone', String(15))
    data_nascimento = Column('data_nascimento', Date, nullable=False)  
    
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
    bairro = Column("bairro", ForeignKey("bairro.id"), nullable=False)
    rua = Column("rua", String, nullable=False)
    numero = Column("numero", Integer)
    complemento = Column("complemento", String, default=None)
    
    def __init__(self, bairro, rua, numero, complemento = None):
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
        ("Em_Analise", "Em_Analise"),
        ("Pendente", "Pendente"),
        ("Em_Execucao", "Em_Execucao"),
        ("Finalizado", "Finalizado"),
        ("Arquivado", "Arquivado"),
    )
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    titulo = Column("titulo", String, nullable=False)
    descricao = Column("descricao", String, nullable=False)
    status = Column("status", ChoiceType(choices=STATUS_PEDIDOS))
    urgencia = Column(Enum("Baixa", "Media", "Alta", "Critica", name="urgencia"), nullable=True)
    data_abertura = Column("data_abertura", DateTime, default=datetime.now, nullable=False)
    data_fechamento = Column("data_fechamento", DateTime)
    id_cidadao = Column("cidadao", ForeignKey("cidadao.id"))
    id_funcionario = Column("funcionario", ForeignKey("funcionario.id"))
    id_endereco = Column("endereco", ForeignKey("endereco.id"))
    
    def __init__(self, titulo, descricao, urgencia, data_fechamento, id_cidadao, id_funcionario, id_endereco, status="PENDENTE"):
        self.titulo = titulo
        self.descricao = descricao
        self.status = status
        self.urgencia = urgencia
        self.data_fechamento = data_fechamento
        self.id_cidadao = id_cidadao
        self.id_funcionario = id_funcionario
        self.id_endereco = id_endereco
        
    def fechar_ocorrencia(self):
        self.status = "FINALIZADO"
        self.data_fechamento = datetime.now()
    
    
class Historico_Ocorrencia(Base):
    __tablename__ = "historico_ocorrencia"
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    data = Column("data", DateTime, default=datetime.now)
    mensagem = Column("mensagem", String, nullable=False)
    status = Column("status", String, nullable=False)
    id_ocorrencia = Column("id_ocorrencia", ForeignKey("ocorrencia.id"), nullable=False)
    
    def __init__(self, mensagem, status, id_ocorrencia):
        self.mensagem = mensagem
        self.status = status
        self.id_ocorrencia = id_ocorrencia


class Servico_Ocorrencia:
    pass

