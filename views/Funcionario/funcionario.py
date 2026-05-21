
from fastapi import APIRouter, Depends, HTTPException, status
from database import pegar_sessao
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.model import Usuario
from schemas.funcionario_schemas import Funcionario_Schema_adicionar, Funcionario_Schema_remover
from controllers.funcionario_controll import FuncionarioController
from utils.security import get_current_user

router_funcionario = APIRouter(prefix="/funcionario", tags=["Funcionario"])

@router_funcionario.post("/adicionar")
async def adicionar_funcionario(dados: Funcionario_Schema_adicionar, session: Session = Depends(pegar_sessao)):
    return await FuncionarioController.adicionar(dados= dados, session= session)

@router_funcionario.post("/remover")
async def remover_funcionario(dados: Funcionario_Schema_remover, session: Session = Depends(pegar_sessao)):
    return await FuncionarioController.remover(dados= dados, session= session)

