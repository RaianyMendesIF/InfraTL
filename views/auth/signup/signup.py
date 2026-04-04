from fastapi import APIRouter

router_signup = APIRouter(prefix="/auth", tags=["Autentificacao"])

@router_signup.get("/signup")
async def criar_conta():
    return {"mensagem": "aqui e a pagina para criar conta"}