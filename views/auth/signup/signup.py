from fastapi import APIRouter, Depends
from dependencies.dependencies import pegar_sessao
from models.model import Usuario
from schemas.schemas import SignupRequest

router = APIRouter(prefix="/auth", tags=["Autentificacao"])

@router.post("/signup")
async def criar_conta(dados: SignupRequest, session = Depends(pegar_sessao)):
    usuario =session.query(Usuario).filter(Usuario.email == dados.email).first()
    if usuario:
        return{"mensagem": "Ja existe um usuario com esse email"}
    try:
        novo_usuario = Usuario(dados.nome, dados.email, dados.senha)
        session.add(novo_usuario)
        session.commit()
        return{"mensagem": "Usuario cadastrado com sucesso"}
    except Exception as e:
        session.rollback()
        return {"erro": f"Erro ao salvar no banco: {str(e)}"}