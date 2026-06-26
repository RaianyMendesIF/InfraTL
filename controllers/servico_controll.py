from fastapi import HTTPException
from models.model import Servico
from sqlalchemy.orm import Session
from schemas.servicos_schema import Servico_schema_lista
from sqlalchemy import text, func

class ServicosController:
    @staticmethod
    async def cadastrar_servicos(dados, session):
        try:
            novo_servico = Servico(
                nome=dados.nome,
                descricao=dados.descricao,
                prazo_estimado_dias=dados.prazo_estimado_dias,
                ativo=True,
            )
            session.add(novo_servico)
            session.commit()
            return {"message": "Serviço cadastrado com sucesso"}

        except HTTPException:
            raise

        except Exception as e:
            session.rollback()
            print(f"ERRO DE BANCO: {e}")
            raise HTTPException(status_code=500, detail=f"Erro interno no banco de dados: {str(e)}")

    @staticmethod
    async def listar_servicos(session):        
        try:
            servicos = session.query(Servico).all()
            return [Servico_schema_lista.from_orm(servico) for servico in servicos] 

        except HTTPException:
            raise

        except Exception as e:
            print(f"ERRO DE BANCO: {e}")
            raise HTTPException(status_code=500, detail=f"Erro interno no banco de dados: {str(e)}")

    @staticmethod
    async def listar_servicos_ativos(session):        
        try:
            servicos = session.query(Servico).filter(Servico.ativo == True).all()
            return [Servico_schema_lista.from_orm(servico) for servico in servicos] 

        except HTTPException:
            raise

        except Exception as e:
            print(f"ERRO DE BANCO: {e}")
            raise HTTPException(status_code=500, detail=f"Erro interno no banco de dados: {str(e)}")

    @staticmethod
    async def editar_servicos(id, dados, session):
        try:
            servico = session.query(Servico).filter(Servico.id == id).first()
            if not servico:
                raise HTTPException(status_code=404, detail="Serviço não encontrado")

            servico.nome = dados.nome
            servico.descricao = dados.descricao
            servico.prazo_estimado_dias = dados.prazo_estimado_dias
            servico.ativo = dados.ativo

            session.commit()
            return {"message": "Serviço atualizado com sucesso"}

        except HTTPException:
            raise

        except Exception as e:
            session.rollback()
            print(f"ERRO DE BANCO: {e}")
            raise HTTPException(status_code=500, detail=f"Erro interno no banco de dados: {str(e)}")
            