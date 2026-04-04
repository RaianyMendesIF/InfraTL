from fastapi import APIRouter

router_occurrence_public = APIRouter(prefix="/ocorrencia", tags=["Ocorrencia"])

@router_occurrence_public.get("/cidadao")
async def painel_ocorrencia_cidadao():
    return {"mensagem": "Esse e o painel do cidadao"}