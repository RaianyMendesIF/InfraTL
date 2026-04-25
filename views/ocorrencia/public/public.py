from fastapi import APIRouter

router = APIRouter(prefix="/ocorrencia", tags=["Ocorrencia"])

@router.get("/cidadao")
async def painel_ocorrencia_cidadao():
    return {"mensagem": "Esse e o painel do cidadao"}