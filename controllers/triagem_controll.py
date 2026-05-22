from fastapi import HTTPException
from models.model import Ocorrencia, Endereco, Bairro, Servico
from sqlalchemy.orm import Session
from schemas.ocorrencia_schemas import Ocorrencia_schema_resposta

class TriagemController:
    @staticmethod
    async def listar_ocorrencias(session: Session, bairro: str = None, tipo: str = None, status: str = None):
        try:
            query = session.query(Ocorrencia)

            # Filtro por status
            if status:
                query = query.filter(Ocorrencia.status == status)

            # Filtro por tipo/serviço
            if tipo:
                servico = session.query(Servico).filter(Servico.nome.ilike(f"%{tipo}%")).first()
                if not servico:
                    raise HTTPException(404, f"Tipo de serviço '{tipo}' não encontrado.")
                query = query.filter(Ocorrencia.id_servico == servico.id)

            # Filtro por bairro
            if bairro:
                bairro_obj = session.query(Bairro).filter(Bairro.nome.ilike(f"%{bairro}%")).first()
                if not bairro_obj:
                    raise HTTPException(404, f"Bairro '{bairro}' não encontrado.")
                query = query.join(Endereco, Ocorrencia.id_endereco == Endereco.id)
                query = query.filter(Endereco.id_bairro == bairro_obj.id)

            ocorrencias = query.order_by(Ocorrencia.data_abertura.desc()).all()

            return {
                "success": True,
                "total": len(ocorrencias),
                "ocorrencias": [Ocorrencia_schema_resposta.model_validate(o).model_dump() for o in ocorrencias]
            }

        except HTTPException:
            raise
        except Exception as e:
            print(f"ERRO: {e}")
            raise HTTPException(500, f"Erro interno: {str(e)}")