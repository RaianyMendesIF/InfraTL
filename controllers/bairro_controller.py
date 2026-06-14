from sqlalchemy.orm import Session
from models.model import Bairro

class BairroController:
    @staticmethod
    async def listar_bairros(session: Session): 
        bairros = session.query(Bairro).all()
        return bairros

    @staticmethod
    async def cadastrar_bairro(dados, session: Session):
        novo_bairro = Bairro(
            nome=dados.nome,
            regiao=dados.regiao
        )
        session.add(novo_bairro)
        session.commit()
        return {"message": "Bairro cadastrado com sucesso!"}

    @staticmethod
    async def editar_bairro(id: int, dados, session: Session):          
        bairro = session.query(Bairro).filter(Bairro.id == id).first()
        if not bairro:
            return {"message": "Bairro não encontrado!"}
        
        bairro.nome = dados.nome
        bairro.regiao = dados.regiao
        session.commit()
        return {"message": "Bairro editado com sucesso!"}