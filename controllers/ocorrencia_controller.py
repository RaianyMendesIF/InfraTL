from models.model import Ocorrencia, Endereco, db
from sqlalchemy.orm import Session
from schemas.ocorrencia_schema import Ocorrencia_schema_cadastro, Endereco_schema_cadastro

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

class EnderecoController:
    @classmethod
    async def cadastrar(cls, dados: Endereco_schema_cadastro) -> Endereco:
        with Session(db) as session:
            endereco = Endereco(
                rua=dados.rua,
                numero=dados.numero,
                complemento=dados.complemento,
                id_bairro=dados.id_bairro,
                endereco_completo=dados.endereco_completo,
                latitude=dados.latitude,
                longitude=dados.longitude
            )
            session.add(endereco)
            session.commit()
            session.refresh(endereco)
            return endereco