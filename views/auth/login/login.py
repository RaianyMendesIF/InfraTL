from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Autentificacao"])

@router.get("/login")
async def logar_conta():
    return {"mensagem": "aqui e a pagina para logar conta"}