from fastapi import Request
from fastapi import APIRouter, Depends, HTTPException, status
from database import pegar_sessao
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.model import Usuario
from schemas.usuario_schemas import (
    Usuario_schema_cadastro,
    Usuario_recuperar_senha,
    Login_schema,
    Token_response,
    Usuario_redefinir_senha,
)
from controllers.usuario_controll import UsuarioController
from utils.security import get_current_user, get_current_admin
from fastapi.security import OAuth2PasswordRequestForm

router_usuario = APIRouter(prefix="/auth", tags=["Autentificacao"])


@router_usuario.post("/cadastrar", status_code=status.HTTP_201_CREATED)
async def criar_conta(dados: Usuario_schema_cadastro, session: Session = Depends(pegar_sessao)):
    return await UsuarioController.cadastrar_usuario(dados=dados, session=session)

@router_usuario.post("/conectar", response_model=Token_response)
async def conectar_conta(request: Request, dados: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(pegar_sessao)):
    return await UsuarioController.login_usuario(dados=dados, session=session, request=request)

#envio de email para o usuario
@router_usuario.post("/recuperar_senha")
async def recuperar_senha(dados: Usuario_recuperar_senha, session: Session = Depends(pegar_sessao)):
    return await UsuarioController.solicitar_recuperar_senha(dados=dados, session=session)

@router_usuario.post("/redefinir_senha")
async def redefinir_senha(dados: Usuario_redefinir_senha, session: Session = Depends(pegar_sessao), usuario_atual: Usuario = Depends(get_current_user)):
    return await UsuarioController.redefinir_senha_usuario(dados=dados, session=session, usuario_atual=usuario_atual)

