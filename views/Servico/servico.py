from fastapi import APIRouter, Depends
from database import pegar_sessao
from sqlalchemy.orm import Session
from models.model import Usuario
from schemas.servicos_schema import Servico_schema_cadastro, Servico_schema_lista, Servico_schema_editar
from controllers.servico_controll import ServicosController
from utils.security import get_current_admin, get_current_user

router_servico = APIRouter(prefix="/servico", tags=["Serviços"])

@router_servico.post("/cadastrar")
async def cadastrar_servico(dados: Servico_schema_cadastro, session: Session = Depends(pegar_sessao), admin: Usuario = Depends(get_current_admin)):
    return await ServicosController.cadastrar_servicos(dados=dados, session=session)

@router_servico.get("/listar")
async def listar_servicos(session: Session = Depends(pegar_sessao), admin: Usuario = Depends(get_current_admin)):
    return await ServicosController.listar_servicos(session=session)

@router_servico.get("/listar_ativos")
async def listar_servicos_ativos(session: Session = Depends(pegar_sessao), user: Usuario = Depends(get_current_user)):
    return await ServicosController.listar_servicos_ativos(session=session)

@router_servico.put("/editar/{id}")
async def editar_servico(id: int, dados: Servico_schema_editar, session: Session = Depends(pegar_sessao), admin: Usuario = Depends(get_current_admin)):
    return await ServicosController.editar_servicos(id=id, dados=dados, session=session)
        
    
