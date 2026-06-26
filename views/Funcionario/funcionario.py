
from fastapi import APIRouter, Depends, HTTPException, status
from database import pegar_sessao
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.model import Usuario
from schemas.funcionario_schemas import Funcionario_Schema_adicionar, Funcionario_Schema_remover, Funcionario_Schema_editar
from controllers.funcionario_controll import FuncionarioController
from utils.security import get_current_admin
from fastapi.security import OAuth2PasswordRequestForm

router_funcionario = APIRouter(prefix="/funcionario", tags=["Funcionario"])

@router_funcionario.post("/adicionar")
async def adicionar_funcionario(dados: Funcionario_Schema_adicionar, session: Session = Depends(pegar_sessao),  usuario_atual: Usuario = Depends(get_current_admin),):
    return await FuncionarioController.adicionar(dados= dados, session= session, usuario_atual=usuario_atual)

@router_funcionario.delete("/remover")
async def remover_funcionario(dados: Funcionario_Schema_remover, session: Session = Depends(pegar_sessao), usuario_atual: Usuario = Depends(get_current_admin)):
    return await FuncionarioController.remover(dados= dados, session= session, usuario_atual=usuario_atual)

@router_funcionario.get("/listar")
async def listar_funcionarios(session: Session = Depends(pegar_sessao), admin: Usuario = Depends(get_current_admin)):
    return await FuncionarioController.listar_funcionarios(session=session) 

@router_funcionario.put("/editar/{id}")
async def editar_funcionario(id: int, dados: Funcionario_Schema_editar, session: Session = Depends(pegar_sessao), usuario_atual: Usuario = Depends(get_current_admin)):
    return await FuncionarioController.editar_funcionario(id=id, dados=dados, session=session, usuario_atual=usuario_atual)