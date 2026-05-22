from fastapi import APIRouter, Depends, HTTPException
from database import pegar_sessao
from sqlalchemy.orm import Session
from sqlalchemy import text
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
    # A MÁGICA DA SEGURANÇA:
    # Forçamos o ID do payload a ser o ID real do usuário autenticado no Token!
    dados.id_usuario = usuario_atual.id

    return await OcorrenciaController.cadastrar_ocorrencia(dados=dados, session=session)
