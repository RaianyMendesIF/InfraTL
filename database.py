import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
    
load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Se a URL começar com postgres:// (padrão antigo), 
# o SQLAlchemy moderno exige que seja postgresql://
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Para o Neon, não usamos o 'check_same_thread' (isso é só do SQLite)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Verifica se a conexão está viva antes de usar (importante para serverless)
    pool_recycle=300     # Fecha conexões paradas após 5 minutos
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Sua função pegar_sessao continua igual!
def pegar_sessao():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()