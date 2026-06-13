from sqlalchemy.orm import Session
from models.model import Bairro

class BairroController:
    @staticmethod
    def listar_bairros(session: Session): 
        bairros = session.query(Bairro).all()
        return bairros

