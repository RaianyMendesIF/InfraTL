from fastapi import APIRouter, Depends, HTTPException
from database import pegar_sessao
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.model import Usuario
from schemas.usuario_schemas import Usuario_schema_cadastro
from controllers.usuario_controll import cadastrar_usuario

router_usuario = APIRouter(prefix="/auth", tags=["Autentificacao"])

@router_usuario.post("/signup")
async def criar_conta(dados: Usuario_schema_cadastro, session: Session = Depends(pegar_sessao)):
    return cadastrar_usuario(dados, session)
