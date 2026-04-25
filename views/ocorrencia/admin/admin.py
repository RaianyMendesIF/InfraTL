from fastapi import APIRouter

router = APIRouter(prefix="/ocorrencia", tags=["Ocorrencia"])

@router.get("/admin")
async def painel_ocorrencia_admin():
    return {"mensagem": "Esse e o painel dos administradores"}