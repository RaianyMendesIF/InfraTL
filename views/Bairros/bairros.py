from fastapi import APIRouter, Depends, HTTPException, status
from database import pegar_sessao
from sqlalchemy.orm import Session
from controllers.bairro_controller import BairroController
from schemas.bairro_schemas import Bairro_schema_lista, Bairro_schema_cadastro, Bairro_schema_editar
from models.model import Usuario
from utils.security import get_current_user, get_current_admin


router_bairros = APIRouter(prefix="/bairros", tags=["Bairros"])

@router_bairros.get("/listar")
async def listar_bairros(session: Session = Depends(pegar_sessao), user: Usuario = Depends(get_current_user)):
    return await BairroController.listar_bairros(session=session)

@router_bairros.post("/cadastrar")
async def cadastrar_bairro(dados: Bairro_schema_cadastro, session: Session = Depends(pegar_sessao), admin: Usuario = Depends(get_current_admin)):
    return await BairroController.cadastrar_bairro(dados=dados, session=session)

@router_bairros.post("/editar/{id}")
async def editar_bairro(id: int, dados: Bairro_schema_editar, session: Session = Depends(pegar_sessao), admin: Usuario = Depends(get_current_admin)):
    return await BairroController.editar_bairro(id=id, dados=dados, session=session)