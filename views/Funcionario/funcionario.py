
from fastapi import APIRouter, Depends, HTTPException, status
from database import pegar_sessao
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.model import Usuario
from schemas.funcionario_schemas import Funcionario_Schema_adicionar
from controllers.funcionario_controll import FuncionarioController

router_funcionario = APIRouter(prefix="/funcionario", tags=["funcionario"])

@router_funcionario.post("/alterar_tipo_usuario")
async def alterar_tipo_usuario(dados: Funcionario_Schema_adicionar, session: Session = Depends(pegar_sessao)):
    return await FuncionarioController.adicionar(dados= dados, session= session)

