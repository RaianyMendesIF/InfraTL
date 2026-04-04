from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Autentificacao"])

@router.get("/signup")
async def criar_conta():
    return {"mensagem": "aqui e a pagina para criar conta"}