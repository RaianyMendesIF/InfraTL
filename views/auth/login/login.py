from fastapi import APIRouter

router_login = APIRouter(prefix="/auth", tags=["Autentificacao"])

@router_login.get("/login")
async def logar_conta():
    return {"mensagem": "aqui e a pagina para logar conta"}