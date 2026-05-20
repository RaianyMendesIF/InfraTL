from fastapi import APIRouter, Depends, HTTPException
from database import pegar_sessao
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.model import Ocorrencia
from schemas.ocorrencia_schemas import Ocorrencia_schema_resposta, Ocorrencia_schema_cadastro
from controllers.ocorrencia_controll import OcorrenciaController

router_ocorrencia = APIRouter(prefix="/ocorrencia", tags=["Ocorrencia"])

@router_ocorrencia.post("/cadastrar") # response_model=Ocorrencia_schema_resposta
async def cadastrar_ocorrencia(dados: Ocorrencia_schema_cadastro, session: Session = Depends(pegar_sessao)):
    return await OcorrenciaController.cadastrar_ocorrencia(dados= dados, session= session)