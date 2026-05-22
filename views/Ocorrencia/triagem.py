from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from database import pegar_sessao
from models.model import Usuario
from controllers.triagem_controll import TriagemController
from utils.security import get_current_user, get_current_admin
from fastapi.security import OAuth2PasswordRequestForm

router_triagem = APIRouter(prefix="/ocorrencia", tags=["Triagem"])

@router_triagem.get("/triagem")
async def listar_ocorrencias(
    bairro: Optional[str] = None,
    tipo: Optional[str] = None,
    status: Optional[str] = None,
    session: Session = Depends(pegar_sessao),
    usuario_atual: Usuario = Depends(get_current_admin)
):
    """
    Lista ocorrências com filtros combináveis.
    
    - ?bairro=Centro
    - ?status=Em_Analise
    - ?tipo=Esgoto
    - ?bairro=Centro&status=Pendente&tipo=Esgoto
    """
    return await TriagemController.listar_ocorrencias(
        session=session,
        bairro=bairro,
        tipo=tipo,
        status=status
    )