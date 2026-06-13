from fastapi import HTTPException
from models.model import Ocorrencia, Endereco, Bairro
from sqlalchemy.orm import Session
from schemas.ocorrencia_schemas import (
    Ocorrencia_schema_cadastro,
    Ocorrencia_schema_resposta, Avaliar_ocorrencia_schema
)
from sqlalchemy import text, func


class OcorrenciaController:
    @staticmethod
    async def cadastrar_ocorrencia(dados, session):
        try:

            bairro = (
                session.query(Bairro)
                .filter(Bairro.nome == dados.endereco.bairro)
                .first()
            )
            if not bairro:
                raise HTTPException(status_code=400, detail="Bairro não encontrado!")

            filtros_endereco = [
                Endereco.rua.ilike(dados.endereco.rua),
                Endereco.numero == dados.endereco.numero,
                Endereco.id_bairro == bairro.id,
            ]

            if dados.endereco.complemento:
                filtros_endereco.append(
                    Endereco.complemento.ilike(dados.endereco.complemento)
                )
            else:
                filtros_endereco.append(Endereco.complemento == None)

            endereco_duplicado = (
                session.query(Endereco).filter(*filtros_endereco).first()
            )

            if endereco_duplicado:
                endereco = endereco_duplicado
            else:
                endereco = Endereco(
                    endereco_completo=dados.endereco.endereco_completo,
                    rua=dados.endereco.rua,
                    numero=dados.endereco.numero,
                    complemento=dados.endereco.complemento,
                    id_bairro=bairro.id,
                    coordenadas=(
                        func.ST_GeographyFromText(dados.endereco.coordenadas)
                        if dados.endereco.coordenadas
                        else None
                    ),
                    latitude=dados.endereco.latitude,
                    longitude=dados.endereco.longitude,
                    fonte_localizacao=dados.endereco.fonte_localizacao,
                )
                session.add(endereco)
                session.flush()

            session.execute(text(f"SET LOCAL app.usuario_id = '{dados.id_usuario}';"))

            ocorrencia = Ocorrencia(
                titulo=dados.titulo,
                descricao=dados.descricao,
                id_usuario=dados.id_usuario,
                id_servico=dados.id_servico,
                id_endereco=endereco.id,
                urgencia=dados.urgencia,
            )

            session.add(ocorrencia)
            session.commit()
            session.execute(text(f"SET LOCAL app.usuario_id = '{dados.id_usuario}';"))
            session.refresh(ocorrencia)

            dados_ocorrencia = Ocorrencia_schema_resposta.model_validate(
                ocorrencia
            ).model_dump()

            return {
                "sucess": True,
                "mensagem": "Ocorrencia cadastrado com sucesso!",
                "ocorrencia": dados_ocorrencia,
            }

        except HTTPException:
            raise

        except Exception as e:
            session.rollback()
            print(f"ERRO DE BANCO: {e}")
            raise HTTPException(status_code=500, detail=f"Erro interno no banco de dados: {str(e)}")
            
    @staticmethod
    def buscar_ocorrencias_por_usuario(session: Session, id_usuario: int):
        return session.query(Ocorrencia).filter(Ocorrencia.id_usuario == id_usuario).all()

def avaliar_ocorrencia(id_ocorrencia: int, dados: Avaliar_ocorrencia_schema, session: Session, id_agente: int):
    ocorrencia = session.query(Ocorrencia).filter(Ocorrencia.id == id_ocorrencia).first()
    
    if not ocorrencia:
        raise HTTPException(status_code=404, detail="Ocorrencia nao encontrada")
    
    if ocorrencia.status != "Em_Analise":
        raise HTTPException(status_code=400, detail=f"A ocorrencia nao pode ser avaliada pois ja esta em status: {ocorrencia.status}")
    
    if dados.aprovado:
        ocorrencia.status = "Pendente"
        ocorrencia.justificativa = None
    else:
        if not dados.justificativa:
            raise HTTPException(status_code=400, detail="Necessario passar uma justificativa para o arquivamento da ocorrencia")
        ocorrencia.status = "Arquivado"
        ocorrencia.justificativa = dados.justificativa
        
    ocorrencia.id_agente_triagem = id_agente
    
    session.commit()
    session.refresh(ocorrencia)
    
    acao_texto = "aprovada" if dados.aprovado else "reprovada"
    return {
        "mensagem": f"Ocorrência {acao_texto} com sucesso!", 
        "novo_status": ocorrencia.status
    }
    
    
        