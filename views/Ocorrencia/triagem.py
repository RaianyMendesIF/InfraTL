from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from database import pegar_sessao
from models.model import Usuario
from controllers.triagem_controll import TriagemController
from utils.security import get_current_user, get_current_admin
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import text

router_triagem = APIRouter(prefix="/ocorrencia", tags=["Triagem"])


@router_triagem.get("/triagem")
async def listar_ocorrencias(
    bairro: Optional[str] = None,
    tipo: Optional[str] = None,
    status: Optional[str] = None,
    session: Session = Depends(pegar_sessao),
    usuario_atual: Usuario = Depends(get_current_admin),
):
    """
    Lista ocorrências com filtros combináveis.

    - ?bairro=Centro
    - ?status=Em_Analise
    - ?tipo=Esgoto
    - ?bairro=Centro&status=Pendente&tipo=Esgoto
    """

    # 1. Primeira chave: Informa o ID do usuário (Usando set_config para segurança)
    session.execute(
        text("SELECT set_config('app.usuario_id', :id, true)"),
        {"id": str(usuario_atual.id)},
    )

    # 2. Segunda chave: Informa o tipo de acesso
    tipo_str = (
        usuario_atual.tipo_usuario.value
        if hasattr(usuario_atual.tipo_usuario, "value")
        else usuario_atual.tipo_usuario
    )
    session.execute(
        text("SELECT set_config('app.tipo_usuario', :tipo, true)"),
        {"tipo": str(tipo_str)},
    )

    return await TriagemController.listar_ocorrencias(
        session=session, bairro=bairro, tipo=tipo, status=status
    )

    # NOTA: Se o seu ficheiro banco.sql exigir também a validação do cargo do administrador para ler TODAS as ocorrências da cidade,
    # adicione também a linha abaixo (ajuste 'cargo' se o nome da propriedade na sua classe Usuario for diferente, ex: 'tipo' ou 'perfil'):
    # ssession.execute(text(f"SET LOCAL app.tipo_usuario = '{usuario_atual.cargo}';"))

    return await TriagemController.listar_ocorrencias(
        session=session, bairro=bairro, tipo=tipo, status=status
    )
