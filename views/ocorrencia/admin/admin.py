from fastapi import APIRouter

router_occurrence_admin = APIRouter(prefix="/ocorrencia", tags=["Ocorrencia"])

@router_occurrence_admin.get("/admin")
async def painel_ocorrencia_admin():
    return {"mensagem": "Esse e o painel dos administradores"}