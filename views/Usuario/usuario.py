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
from controllers.usuario_controll import cadastrar_usuario, recuperar_senha, login_usuario, redefinir_senha_usuario
from utils.security import get_current_user, get_current_admin

router_usuario = APIRouter(prefix="/auth", tags=["Autentificacao"])


@router_usuario.post("/signup", status_code=status.HTTP_201_CREATED)
async def criar_conta(
    dados: Usuario_schema_cadastro, session: Session = Depends(pegar_sessao)
):
    return cadastrar_usuario(dados=dados, session=session)


@router_usuario.post("/recuperar-senha")
async def recuperar_senha_rota(
    dados: Usuario_recuperar_senha, session: Session = Depends(pegar_sessao)
):
    return recuperar_senha(dados=dados, session=session)


@router_usuario.post("/login", response_model=Token_response)
async def login(
    request: Request, dados: Login_schema, session: Session = Depends(pegar_sessao)
):
    return login_usuario(
        dados=dados, session=session, request=request
    )

@router_usuario.post("/recuperar-senha")
async def recuperar_senha(dados: Usuario_recuperar_senha, session: Session = Depends(pegar_sessao)):
    return recuperar_senha(dados=dados, session=session)

@router_usuario.post("/redefinir-senha")
async def redefinir_senha(dados: Usuario_redefinir_senha, session: Session = Depends(pegar_sessao)):
    return redefinir_senha_usuario(dados=dados, session=session)


# --- EXEMPLO DE ROTAS PROTEGIDAS
@router_usuario.get("/perfil")
async def rota_cidadao_e_funcionario(
    usuario_atual: Usuario = Depends(get_current_user),
):
    """Qualquer pessoa logada acessa essa rota (Cidadão ou Funcionário)"""
    return {
        "mensagem": f"Olá, {usuario_atual.nome}! Seu tipo é {usuario_atual.tipo_usuario.value}"
    }


@router_usuario.get("/admin/dashboard")
async def rota_apenas_funcionario(usuario_atual: Usuario = Depends(get_current_admin)):
    """Apenas usuários com tipo_usuario == 'Admin' acessam (Atende ao bloqueio da Story 2)"""
    return {"mensagem": "Bem-vindo ao painel de controle, agente!"}
