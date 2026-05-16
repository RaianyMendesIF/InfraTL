from fastapi import APIRouter
from schemas.ocorrencia_schema import Ocorrencia_schema_cadastro, Ocorrencia_schema_resposta, Endereco_schema_cadastro, Endereco_schema_resposta
from controllers.ocorrencia_controller import OcorrenciaController, EnderecoController

router = APIRouter(prefix="/ocorrencia", tags=["Ocorrencia"])

@router.get("/cidadao")
async def painel_ocorrencia_cidadao():
    return {"mensagem": "Esse e o painel do cidadao"}

@router.post("/cadastrar", response_model=Ocorrencia_schema_resposta)
async def cadastrar_ocorrencia(dados: Ocorrencia_schema_cadastro):
    return await OcorrenciaController.cadastrar(dados)

@router.post("/endereco", response_model=Endereco_schema_resposta)
async def cadastrar_endereco(dados: Endereco_schema_cadastro):
    return await EnderecoController.cadastrar(dados)