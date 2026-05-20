from fastapi import APIRouter, Depends, HTTPException, status
from database import pegar_sessao
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.model import Usuario
from schemas.usuario_schemas import Usuario_schema_cadastro, Usuario_recuperar_senha
from controllers.usuario_controll import UsuarioController

router_usuario = APIRouter(prefix="/auth", tags=["Autentificacao"])

@router_usuario.post("/signup", status_code=status.HTTP_201_CREATED)
async def criar_conta(dados: Usuario_schema_cadastro, session: Session = Depends(pegar_sessao)):
    return await UsuarioController.cadastrar_usuario(dados= dados, session= session)


@router_usuario.post("/recuperar-senha")
async def recuperar_senha(dados: Usuario_recuperar_senha, session: Session = Depends(pegar_sessao)):
    pass