from fastapi import HTTPException
from models.model import Ocorrencia, Endereco, Bairro
from sqlalchemy.orm import Session
from schemas.ocorrencia_schemas import Ocorrencia_schema_cadastro, Ocorrencia_schema_resposta

class OcorrenciaController:
    @staticmethod
    async def cadastrar_ocorrencia(dados, session):
        try:       
            
            bairro = session.query(Bairro).filter(Bairro.nome == dados.endereco.bairro).first()
            if not bairro:
                raise HTTPException(status_code=400, detail="Bairro não encontrado!")

            
            filtros_endereco = [
                Endereco.rua.ilike(dados.endereco.rua),
                Endereco.numero == dados.endereco.numero,
                Endereco.id_bairro == bairro.id 
            ]

            if dados.endereco.complemento:
                filtros_endereco.append(Endereco.complemento.ilike(dados.endereco.complemento))
            else:
                filtros_endereco.append(Endereco.complemento == None)

            endereco_duplicado = session.query(Endereco).filter(*filtros_endereco).first()

            if endereco_duplicado:
                endereco = endereco_duplicado
            else:
                endereco = Endereco( 
                    endereco_completo = dados.endereco.endereco_completo, 
                    rua = dados.endereco.rua, 
                    numero = dados.endereco.numero, 
                    complemento = dados.endereco.complemento, 
                    id_bairro = bairro.id, 
                    coordenadas = func.ST_GeographyFromText(dados.endereco.coordenadas) if dados.endereco.coordenadas else None, 
                    latitude = dados.endereco.latitude, 
                    longitude = dados.endereco.longitude, 
                    fonte_localizacao = dados.endereco.fonte_localizacao
                )
                session.add(endereco)
                session.flush() 

            ocorrencia = Ocorrencia(
                    titulo=dados.titulo,
                    descricao=dados.descricao,
                    id_usuario=dados.id_usuario,
                    id_servico=dados.id_servico,
                    id_endereco=endereco.id,
                    urgencia=dados.urgencia
                )
            
            session.add(ocorrencia)
            session.commit()
            session.refresh(ocorrencia)

            dados_ocorrencia = Ocorrencia_schema_resposta.model_validate(ocorrencia).model_dump()

            return {"sucess": True, "mensagem": "Ocorrencia cadastrado com sucesso!", "ocorrencia": dados_ocorrencia}

        except HTTPException:
            raise
            
        except Exception as e:
            session.rollback()
            print(f"ERRO DE BANCO: {e}")
            raise HTTPException(status_code=500, detail=f"Erro interno no banco de dados: {str(e)}")
