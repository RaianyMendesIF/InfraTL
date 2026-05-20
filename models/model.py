from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey, DateTime, Date, Enum
from sqlalchemy.orm import declarative_base
from datetime import datetime
from passlib.context import CryptContext
import enum
import bcrypt
from geoalchemy2 import Geography

Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class TipoUsuario(enum.Enum):
    Usuario = "Usuario"
    Admin = "Admin"

class CargoFuncionario(enum.Enum):
    Agente = "Agente"
    Gestor = "Gestor"

class Usuario(Base):
    __tablename__ = "usuario"
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String, nullable=False)
    cpf = Column("cpf", String, nullable=False)
    telefone = Column("telefone", String, nullable=False)
    data_nascimento = Column("data_nascimento", Date, nullable=False)
    email = Column("email", String, nullable=False, unique=True)
    senha_hash = Column("senha_hash", String, nullable=False)
    tipo_usuario = Column(Enum(TipoUsuario), nullable=False, default=TipoUsuario.Usuario)
    ativo = Column("ativo", Boolean, nullable=False, default=True)
    tentativas_login = Column("tentativas_login", Integer, nullable=False, default=0)
    bloqueado_ate = Column("bloqueado_ate", DateTime, default=None)
    criado_em = Column("criado_em", DateTime, nullable=False, default=datetime.now)
    atualizado_em = Column("atualizado_em", DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
    id_endereco = Column("id_endereco", Integer, ForeignKey("endereco.id"))
    
    
    def __init__(self, nome, cpf, telefone, data_nascimento, email, senha,  id_endereco, tipo_usuario=TipoUsuario.Usuario, ativo=True, tentativas_login=0, bloqueado_ate=None):
        self.nome = nome
        self.cpf = cpf
        self.telefone = telefone
        self.data_nascimento = data_nascimento
        self.email = email
        self.senha_hash = self.gerar_hash_senha(senha)
        self.id_endereco = id_endereco
        self.tipo_usuario = tipo_usuario
        self.ativo = ativo
        self.tentativas_login = tentativas_login
        self.bloqueado_ate = bloqueado_ate
       
    
    def gerar_hash_senha(self, senha_pura):
        senha_bytes = senha_pura.encode('utf-8')
        salt = bcrypt.gensalt()
        hash_bytes = bcrypt.hashpw(senha_bytes, salt)
        return hash_bytes.decode('utf-8')

    def verificar_senha(self, senha_pura):
        return bcrypt.checkpw(senha_pura.encode('utf-8'), self.senha_hash.encode('utf-8'))
            
    
class Funcionario(Base):
    __tablename__ = "funcionario"
    
    id_usuario = Column("id_usuario", Integer, ForeignKey("usuario.id"), primary_key=True)  
    matricula = Column("matricula", String, nullable=False, unique=True)
    cargo = Column("cargo", String, nullable=False)

    def __init__(self, id_usuario, matricula, cargo):
        self.id_usuario = id_usuario
        self.matricula = matricula
        self.cargo = cargo
    
    
    
          
        
class Endereco(Base):
    __tablename__ = "endereco"
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    endereco_completo = Column("endereco_completo", String(500), default=None)
    rua = Column("rua", String(200))
    numero = Column("numero", String(20))
    complemento = Column("complemento", String(100), default=None)
    id_bairro = Column("id_bairro", Integer, ForeignKey("bairro.id"), nullable=False)
    coordenadas = Column(Geography(geometry_type="POINT", srid=4326), nullable=True, default=None)
    latitude = Column('latitude', Float, default=None)
    longitude = Column('longitude', Float, default=None)
    fonte_localizacao = Column('fonte_localizacao', String, default='manual')
    
    def __init__(self, id_bairro, rua, numero, complemento=None, endereco_completo=None, coordenadas=None, latitude=None, longitude=None, fonte_localizacao='manual'):
        self.id_bairro = id_bairro
        self.rua = rua
        self.numero = numero
        self.complemento = complemento
        self.endereco_completo = endereco_completo
        self.coordenadas = coordenadas
        self.latitude = latitude
        self.longitude = longitude
        self.fonte_localizacao = fonte_localizacao
        



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
    titulo = Column("titulo", String(100), nullable=False)
    descricao = Column("descricao", String(300), nullable=False)
    status = Column("status", Enum("Em_Analise", "Pendente", "Em_Execucao", "Finalizado", "Arquivado", name="status_ocorrencia_enum"), nullable=False, default="Em_Analise")
    urgencia = Column("urgencia", Enum("Baixa", "Media", "Alta", "Critica", name="urgencia_enum"), nullable=True)
    justificativa = Column("justificativa", String(300), default=None)
    data_abertura = Column("data_abertura", DateTime, default=datetime.now, nullable=False)
    data_fechamento = Column("data_fechamento", DateTime)
    id_usuario = Column("id_usuario", Integer, ForeignKey("usuario.id"), nullable=False)
    id_servico = Column("id_servico", Integer, ForeignKey("servico.id"), nullable=False)
    id_endereco = Column("id_endereco", Integer, ForeignKey("endereco.id"), nullable=False)
    id_agente_triagem = Column("id_agente_triagem", Integer, ForeignKey("funcionario.id_usuario"), default=None)
    id_agente_execucao = Column("id_agente_execucao", Integer, ForeignKey("funcionario.id_usuario"), default=None)
    id_agente_finalizado = Column("id_agente_finalizado", Integer, ForeignKey("funcionario.id_usuario"), default=None)
    
    def __init__(self, titulo, descricao, id_usuario, id_servico, id_endereco, urgencia=None, status="Em_Analise", data_fechamento=None, justificativa=None):
        self.titulo = titulo
        self.descricao = descricao
        self.status = status
        self.urgencia = urgencia
        self.data_fechamento = data_fechamento
        self.id_usuario = id_usuario
        self.id_servico = id_servico
        self.id_endereco = id_endereco
        self.justificativa = justificativa
        
    def fechar_ocorrencia(self):
        self.status = "Finalizado"
        self.data_fechamento = datetime.now()
    
    
class Historico_Ocorrencia(Base):
    __tablename__ = "historico_ocorrencia"
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    id_ocorrencia = Column("id_ocorrencia", Integer, ForeignKey("ocorrencia.id"), nullable=False)
    status_anterior = Column("status_anterior", Enum("Em_Analise", "Pendente", "Em_Execucao", "Finalizado", "Arquivado", name="status_ocorrencia_enum"), default=None)
    status_novo = Column("status_novo", Enum("Em_Analise", "Pendente", "Em_Execucao", "Finalizado", "Arquivado", name="status_ocorrencia_enum"), nullable=False)
    mensagem = Column("mensagem", String(300))
    alterado_por = Column("alterado_por", Integer, ForeignKey("usuario.id"), default=None)
    criado_em = Column("criado_em", DateTime, default=datetime.now, nullable=False)
    
    def __init__(self, id_ocorrencia, status_novo, status_anterior=None, mensagem=None, alterado_por=None):
        self.id_ocorrencia = id_ocorrencia
        self.status_anterior = status_anterior
        self.status_novo = status_novo
        self.mensagem = mensagem
        self.alterado_por = alterado_por


class Servico(Base):
    __tablename__ = 'servico'

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String(100), nullable=False, unique=True)
    descricao = Column("descricao", String)
    prazo_estimado_dias = Column("prazo_estimado_dias", Integer)
    ativo = Column("ativo", Boolean, default=True, nullable=False)
    
    def __init__(self, nome, descricao=None, prazo_estimado_dias=None, ativo=True):
        self.nome = nome
        self.descricao = descricao
        self.prazo_estimado_dias = prazo_estimado_dias
        self.ativo = ativo