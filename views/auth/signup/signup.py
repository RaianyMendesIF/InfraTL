from fastapi import APIRouter, Depends, HTTPException
from database import pegar_sessao
from models.model import Usuario
from schemas.schemas import Usuario_schema_cadastro
from sqlalchemy.orm import Session
from sqlalchemy import text

router = APIRouter(prefix="/auth", tags=["Autentificacao"])

@router.post("/signup")
async def criar_conta(dados: Usuario_schema_cadastro, session: Session = Depends(pegar_sessao)):
    try:
        # 1. Movido para DENTRO do try. Se a tabela não existir, vai cair no except!
        usuario = session.query(Usuario).filter(Usuario.email == dados.email).first()
        
        if usuario:
            # Idealmente, conflitos são status 400 ou 409
            raise HTTPException(status_code=400, detail="Ja existe um usuario com esse email")
            
        novo_usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha=dados.senha  # A senha será hasheada pelo __init__ do seu modelo
        )
        session.add(novo_usuario)
        session.commit()
        return {"mensagem": "Usuario cadastrado com sucesso"}
        
    except HTTPException:
        # Repassa o erro 400 se o email já existir, sem fazer rollback (pois não houve erro de banco)
        raise
        
    except Exception as e:
        # 2. Se a tabela não existir ou der erro de coluna, cai aqui!
        session.rollback()
        print(f"ERRO DE BANCO: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno no banco de dados: {str(e)}")


@router.get("/test-db")
async def validar_conexao(session: Session = Depends(pegar_sessao)):
    try:
        session.execute(text("SELECT 1"))
        return {"status": "sucesso", "mensagem": "Conectado ao Neon!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro real: {str(e)}")