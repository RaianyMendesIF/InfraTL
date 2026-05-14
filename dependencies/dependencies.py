from models.model import db
from sqlalchemy.orm import sessionmaker

SessionLocal = sessionmaker(bind=db, autocommit=False, autoflush=False)

def pegar_sessao():
    try:
        session = SessionLocal
        yield session
    finally:
        session.close()