from models.model import db
from sqlalchemy.orm import sessionmaker

SessionLocal = sessionmaker(bind=db, autocommit=False, autoflush=False)

def pegar_sessao():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()