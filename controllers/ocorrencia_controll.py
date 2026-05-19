from models.model import Ocorrencia, Endereco
from sqlalchemy.orm import Session
from schemas.ocorrencia_schemas import Ocorrencia_schema_cadastro

class OcorrenciaController:
    @classmethod
    async def cadastrar(cls, dados: Ocorrencia_schema_cadastro) -> Ocorrencia:
        with Session(db) as session:
            ocorrencia = Ocorrencia(
                titulo=dados.titulo,
                descricao=dados.descricao,
                id_cidadao=dados.id_cidadao,
                id_servico=dados.id_servico,
                id_endereco=dados.id_endereco,
                urgencia=dados.urgencia
            )
            session.add(ocorrencia)
            session.commit()
            session.refresh(ocorrencia)
            return ocorrencia
