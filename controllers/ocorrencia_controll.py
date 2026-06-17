from fastapi import HTTPException, BackgroundTasks
from models.model import Ocorrencia, Endereco, Bairro, Servico
from sqlalchemy.orm import Session
from schemas.ocorrencia_schemas import (
    Ocorrencia_schema_cadastro,
    Ocorrencia_schema_resposta, Avaliar_ocorrencia_schema
)
from sqlalchemy import text, func
from utils.security import enviar_email_notificacao_ocorrencia


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

    @staticmethod
    def avaliar_ocorrencia(id_ocorrencia: int, dados: Avaliar_ocorrencia_schema, session: Session, id_agente: int, background_tasks: BackgroundTasks):
        ocorrencia = session.query(Ocorrencia).filter(Ocorrencia.id == id_ocorrencia).first()
        
        if not ocorrencia:
            raise HTTPException(status_code=404, detail="Ocorrencia nao encontrada")
        
        if ocorrencia.status != "Em_Analise":
            raise HTTPException(status_code=400, detail=f"A ocorrencia nao pode ser avaliada pois ja esta em status: {ocorrencia.status}")
        
        status_antigo = ocorrencia.status
        
        if dados.aprovado:
            ocorrencia.status = "Pendente"
            ocorrencia.justificativa = None
            ocorrencia.urgencia = dados.urgencia
        else:
            if not dados.justificativa:
                raise HTTPException(status_code=400, detail="Necessario passar uma justificativa para o arquivamento da ocorrencia")
            ocorrencia.status = "Arquivado"
            ocorrencia.justificativa = dados.justificativa
            ocorrencia.urgencia = None
        ocorrencia.id_agente_triagem = id_agente
        
        session.commit()
        session.refresh(ocorrencia)
        
        if ocorrencia.status != status_antigo:
            # Pegando o e-mail do cidadão através do relacionamento do model
            email_cidadao = ocorrencia.usuario.email 
            
            background_tasks.add_task(
                enviar_email_notificacao_ocorrencia,
                email_destino=email_cidadao,
                id_ocorrencia=ocorrencia.id,
                titulo=ocorrencia.titulo,
                status_anterior= status_antigo,
                status_novo=ocorrencia.status
            )
        
        acao_texto = "aprovada" if dados.aprovado else "reprovada"
        return {
            "mensagem": f"Ocorrência {acao_texto} com sucesso!", 
            "novo_status": ocorrencia.status
        }
    
    @staticmethod
    def atualizar_status_ocorrencia(id_ocorrencia: int, novo_status: str, id_agente: int, session: Session, background_tasks: BackgroundTasks):
        try:
            ocorrencia = session.query(Ocorrencia).filter(Ocorrencia.id == id_ocorrencia).first()
            
            if not ocorrencia:
                raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
            
            status_antigo = ocorrencia.status
            
            if novo_status == "Em_Execucao":
                if status_antigo != "Pendente":
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Só é possível iniciar a execução de ocorrências com status Pendente. Status atual: {ocorrencia.status}"
                    )
                    
            elif novo_status == "Finalizado":
                if status_antigo != "Em_Execucao":
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Só é possível finalizar ocorrências que estão Em Execução. Status atual: {status_antigo}"
                    )
            
            if status_antigo == novo_status:
                return ocorrencia
            
            ocorrencia.status = novo_status
            ocorrencia.id_agente_execucao = id_agente
            
            session.commit()
            session.refresh(ocorrencia)
            
            background_tasks.add_task(
                enviar_email_notificacao_ocorrencia,
                email_destino=ocorrencia.usuario.email,
                id_ocorrencia=ocorrencia.id,
                titulo=ocorrencia.titulo,
                status_anterior=status_antigo,
                status_novo=ocorrencia.status
            )
            
            return ocorrencia
        
        except HTTPException:
            # Se for um erro que nós mesmos lançamos (404, 400), só repassa ele para frente
            raise
        except Exception as e:
            # Se der erro de banco, conexão ou qualquer coisa inesperada, desfaz a alteração
            session.rollback()
            print(f"ERRO AO INICIAR EXECUÇÃO: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"Erro interno ao atualizar para Em Execução: {str(e)}"
            )
            
    
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
    
        