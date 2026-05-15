from fastapi import APIRouter, Depends
from dependencies.dependencies import pegar_sessao
from models.model import Usuario
from schemas.schemas import Usuario_schema_cadastro
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Autentificacao"])

@router.post("/signup")
async def criar_conta(dados: Usuario_schema_cadastro, session: Session = Depends(pegar_sessao)):
    usuario = session.query(Usuario).filter(Usuario.email == dados.email).first()
    if usuario:
        return {"mensagem": "Ja existe um usuario com esse email"}
    try:
        novo_usuario = Usuario(
            nome=dados.nome,
            email=dados.email,
            senha=dados.senha,
            tipo_usuario=dados.tipo_usuario,
            ativo=dados.ativo,
            tentativas_login=dados.tentativas_login,
            bloqueado_ate=dados.bloqueado_ate
        )
        session.add(novo_usuario)
        session.commit()
        return {"mensagem": "Usuario cadastrado com sucesso"}
    except Exception as e:
        session.rollback()
        print(f"ERRO DE BANCO: {e}")
        return {"status": 500, "detalhe_tecnico": str(e)}