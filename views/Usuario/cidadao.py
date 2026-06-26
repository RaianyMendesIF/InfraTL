from fastapi import APIRouter, Depends
from database import pegar_sessao
from sqlalchemy.orm import Session
from models.model import Usuario
from controllers.usuario_controll import UsuarioController
from utils.security import get_current_admin

router_cidadao = APIRouter(prefix="/cidadao", tags=["Cidadao"])

@router_cidadao.get("/listar_cidadoes")
async def listar_cidadoes(session: Session = Depends(pegar_sessao), usuario_atual: Usuario = Depends(get_current_admin)):
    return await UsuarioController.listar_cidadoes(session=session)