from fastapi import APIRouter, Depends
from database import pegar_sessao
from schemas.teste_schemas import TesteConexao
from sqlalchemy.orm import Session
from sqlalchemy import text
from controllers.teste_controll import testes

router_teste = APIRouter(prefix="/teste", tags=["Testes"])

@router_teste.get("/testedb")
async def testar_conexao(session: Session = Depends(pegar_sessao)):
    try:
        num = session.execute(text("SELECT 1"))
        return {"status": "sucesso", "mensagem": "Conectado ao Neon!", "valor": num}
    except Exception as e:
        return {"status": "erro", "detalhe": str(e)}
    
