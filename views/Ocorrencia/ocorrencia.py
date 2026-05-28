from fastapi import APIRouter, Depends, HTTPException
from database import pegar_sessao
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from models.model import Ocorrencia, Usuario
from schemas.ocorrencia_schemas import (
    Ocorrencia_schema_resposta,
    Ocorrencia_schema_cadastro,
)
from controllers.ocorrencia_controll import OcorrenciaController
from utils.security import get_current_user, get_current_admin
from fastapi.security import OAuth2PasswordRequestForm

router_ocorrencia = APIRouter(prefix="/ocorrencia", tags=["Ocorrencia"])

@router_ocorrencia.post("/cadastrar")  # response_model=Ocorrencia_schema_resposta
async def cadastrar_ocorrencia(
    dados: Ocorrencia_schema_cadastro,
    session: Session = Depends(pegar_sessao),
    usuario_atual: Usuario = Depends(get_current_user),
):
    return await OcorrenciaController.cadastrar_ocorrencia(dados=dados, session=session)
  
@router_ocorrencia.get("/minhas", response_model=List[Ocorrencia_schema_resposta])
async def listar_minhas_ocorrencias(
    session: Session = Depends(pegar_sessao),
    usuario_atual: Usuario = Depends(get_current_user)
):
    """Retorna todas as ocorrências do usuário logado."""
    return OcorrenciaController.buscar_ocorrencias_por_usuario(
        session=session, 
        id_usuario=usuario_atual.id
    )