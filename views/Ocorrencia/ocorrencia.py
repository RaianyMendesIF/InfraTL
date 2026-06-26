from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from database import pegar_sessao
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from models.model import Ocorrencia, Usuario
from schemas.ocorrencia_schemas import (
    Ocorrencia_schema_resposta,
    Ocorrencia_schema_cadastro,
    Avaliar_ocorrencia_schema,
    Ocorrencia_schema_listar,
    Mudar_status_ocorrencia_schema
)
from controllers.ocorrencia_controll import OcorrenciaController
from utils.security import get_current_user, get_current_admin
from fastapi.security import OAuth2PasswordRequestForm

router_ocorrencia = APIRouter(prefix="/ocorrencia", tags=["Ocorrencia"])

@router_ocorrencia.post("/cadastrar") 
async def cadastrar_ocorrencia(
    dados: Ocorrencia_schema_cadastro,
    session: Session = Depends(pegar_sessao),
    usuario_atual: Usuario = Depends(get_current_user),):
    return await OcorrenciaController.cadastrar_ocorrencia(dados=dados, session=session)
  
@router_ocorrencia.get("/minhas", response_model=List[Ocorrencia_schema_resposta])
async def listar_minhas_ocorrencias(
    session: Session = Depends(pegar_sessao),
    usuario_atual: Usuario = Depends(get_current_user)):

    """Retorna todas as ocorrências do usuário logado."""
    return OcorrenciaController.buscar_ocorrencias_por_usuario(
        session=session, 
        id_usuario=usuario_atual.id
    )
    
@router_ocorrencia.patch("/{id_ocorrencia}/avaliar")
async def avaliar_ocorrencia(id_ocorrencia: int, dados: Avaliar_ocorrencia_schema, background_tasks: BackgroundTasks, session: Session = Depends(pegar_sessao), id_admin: Usuario = Depends(get_current_admin)):
    
    return OcorrenciaController.avaliar_ocorrencia(
        id_ocorrencia = id_ocorrencia,
        dados = dados,
        session = session,
        id_agente = id_admin.id,
        background_tasks=background_tasks    
    )
    
@router_ocorrencia.patch("/{id_ocorrencia}/status", response_model=Ocorrencia_schema_resposta)
def atualizar_status_ocorrencia(id_ocorrencia: int, dados: Mudar_status_ocorrencia_schema, background_tasks: BackgroundTasks, session: Session = Depends(pegar_sessao), agente_atual: Usuario = Depends(get_current_admin)):
    return OcorrenciaController.atualizar_status_ocorrencia(
        id_ocorrencia=id_ocorrencia,
        novo_status=dados.status,
        id_agente=agente_atual.id,
        session=session,
        background_tasks=background_tasks
    )

@router_ocorrencia.get("/listar") 
async def listar_ocorrencias(bairro: str = None, tipo: str = None, status: str = None,
    session: Session = Depends(pegar_sessao), 
    id_admin: Usuario = Depends(get_current_admin)):

    return await OcorrenciaController.listar_ocorrencias(bairro=bairro, tipo=tipo, status=status, session=session)