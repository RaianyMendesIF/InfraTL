from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import pegar_sessao
from models.model import Usuario
from utils.security import get_current_admin
from controllers.dashboard_controll import DashboardController

router_dashboard = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router_dashboard.get("/indicadores")
async def visualizar_dashboard(
    session: Session = Depends(pegar_sessao),
    usuario_atual: Usuario = Depends(get_current_admin),
):
    return await DashboardController.obter_indicadores(
        session=session, usuario_atual=usuario_atual
    )
