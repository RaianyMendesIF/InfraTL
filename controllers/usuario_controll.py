from fastapi import FastAPI, HTTPException
from sqlalchemy import func
from models.model import Usuario, Bairro, Endereco
from schemas.usuario_schemas import Usuario_response

class UsuarioController:
    @classmethod
    async def cadastrar_usuario(dados, session):
        try:
            usuario = session.query(Usuario).filter(Usuario.email == dados.email).first()
            if usuario: 
                raise HTTPException(status_code=400, detail="Ja existe um usuario com esse email")

            bairro = session.query(Bairro).filter(Bairro.nome == dados.endereco.bairro).first()
            if not bairro:
                raise HTTPException(status_code=400, detail="Bairro não encontrado!")

            endereco_duplicado = session.query(Endereco).filter(
                Endereco.rua.ilike(dados.endereco.rua),
                Endereco.numero == dados.endereco.numero,
                Endereco.complemento.ilike(dados.endereco.complemento) if dados.endereco.complemento else Endereco.complemento == None,
                Endereco.id_bairro == bairro.id
            ).first()

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
            
            novo_usuario = Usuario(
                nome= dados.nome,
                cpf= dados.cpf,
                telefone= dados.telefone,
                data_nascimento= dados.data_nascimento,
                email= dados.email,
                senha= dados.senha,
                id_endereco = endereco.id,
            )
            session.add(novo_usuario)
            session.commit()
            session.refresh(novo_usuario)

            # novo_usuario.endereco = endereco

            usuario_seguro = Usuario_response.model_validate(novo_usuario).model_dump()

            return {"sucess": True, "mensagem": "Usuário cadastrado com sucesso!", "usuario": usuario_seguro}
                
        except HTTPException:
            raise
            
        except Exception as e:
            session.rollback()
            print(f"ERRO DE BANCO: {e}")
            raise HTTPException(status_code=500, detail=f"Erro interno no banco de dados: {str(e)}")