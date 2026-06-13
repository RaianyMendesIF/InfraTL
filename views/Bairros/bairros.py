from fastapi import APIRouter, Depends, HTTPException, status
from database import pegar_sessao
from sqlalchemy.orm import Session
from controllers.bairro_controller import BairroController
from schemas.bairro_schemas import Bairro_schema


router_bairros = APIRouter(prefix="/bairros", tags=["Bairros"])

@router_bairros.get("/")
def listar_bairros(session: Session = Depends(pegar_sessao)):
    try:
        bairros = BairroController.listar_bairros(session=session)
        return bairros
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar bairros no banco de dados: {str(e)}"
        )
   