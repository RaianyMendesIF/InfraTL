from datetime import datetime
from fastapi import Request, HTTPException
from sqlalchemy import func, text
from sqlalchemy.orm import Session
import re

from models.model import Usuario, Bairro, Endereco, Funcionario
from schemas.usuario_schemas import Usuario_response
from security import criar_token_jwt


class UsuarioController:
    @staticmethod
    async def cadastrar_usuario(dados, session):
        try:
            usuario = (
                session.query(Usuario).filter(Usuario.email == dados.email).first()
            )
            if usuario:
                raise HTTPException(
                    status_code=400, detail="Ja existe um usuario com esse email"
                )

            bairro = (
                session.query(Bairro)
                .filter(Bairro.nome == dados.endereco.bairro)
                .first()
            )
            if not bairro:
                raise HTTPException(status_code=400, detail="Bairro não encontrado!")

            endereco_duplicado = (
                session.query(Endereco)
                .filter(
                    Endereco.rua.ilike(dados.endereco.rua),
                    Endereco.numero == dados.endereco.numero,
                    (
                        Endereco.complemento.ilike(dados.endereco.complemento)
                        if dados.endereco.complemento
                        else Endereco.complemento == None
                    ),
                    Endereco.id_bairro == bairro.id,
                )
                .first()
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

            novo_usuario = Usuario(
                nome=dados.nome,
                cpf=dados.cpf,
                telefone=dados.telefone,
                data_nascimento=dados.data_nascimento,
                email=dados.email,
                senha=dados.senha,
                id_endereco=endereco.id,
            )
            session.add(novo_usuario)
            session.commit()
            session.refresh(novo_usuario)

            usuario_seguro = Usuario_response.model_validate(novo_usuario).model_dump()

            return {
                "sucess": True,
                "mensagem": "Usuário cadastrado com sucesso!",
                "usuario": usuario_seguro,
            }

        except HTTPException:
            raise

        except Exception as e:
            session.rollback()
            print(f"ERRO DE BANCO: {e}")
            raise HTTPException(
                status_code=500, detail=f"Erro interno no banco de dados: {str(e)}"
            )

    @staticmethod  # CORREÇÃO 3: Adicionado o staticmethod
    async def recuperar_senha(dados, session):
        try:
            usuario = (
                session.query(Usuario).filter(Usuario.email == dados.email).first()
            )
            if usuario:
                # Enviar e email de verificação
                return {
                    "sucess": True,
                    "mensagem": "Usuário encotrado, email de recuperação enviado",
                }
            else:
                return {"sucess": False, "mensagem": "Usuário não encotrado!"}

        except HTTPException:
            raise

        except Exception as e:
            session.rollback()
            print(f"ERRO DE BANCO: {e}")
            raise HTTPException(
                status_code=500, detail=f"Erro interno no banco de dados: {str(e)}"
            )

    @staticmethod
    async def login_usuario(
        dados, session, request: Request
    ):  # CORREÇÃO 2: Tipagem do request
        try:
            identificador = dados.identificador
            senha = dados.senha
            usuario = None

            # 1. Verifica qual o tipo de credencial (Cidadão ou Funcionário)
            if "@" in identificador:
                usuario = (
                    session.query(Usuario)
                    .filter(Usuario.email == identificador)
                    .first()
                )
            elif identificador.isdigit() and len(identificador) == 11:
                usuario = (
                    session.query(Usuario).filter(Usuario.cpf == identificador).first()
                )
            else:
                # Se não é email nem CPF, tenta como matrícula
                funcionario = (
                    session.query(Funcionario)
                    .filter(Funcionario.matricula == identificador)
                    .first()
                )
                if funcionario:
                    usuario = (
                        session.query(Usuario)
                        .filter(Usuario.id == funcionario.id_usuario)
                        .first()
                    )

            ip_cliente = (
                request.client.host if request and request.client else "0.0.0.0"
            )

            if not usuario:
                raise HTTPException(status_code=401, detail="Credenciais inválidas")

            # Verifica se o usuário está bloqueado pela trigger do banco
            if (
                usuario.bloqueado_ate
                and usuario.bloqueado_ate.timestamp() > datetime.now().timestamp()
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Conta temporariamente bloqueada por múltiplas tentativas falhas.",
                )

            if not usuario.verificar_senha(senha):
                # Registra falha no banco para disparar a trigger de bloqueio
                session.execute(
                    text("""
                    INSERT INTO log_acesso (id_usuario, ip_hash, sucesso, motivo_falha)
                    VALUES (:id_usr, :ip, false, 'Senha incorreta')
                """),
                    {"id_usr": usuario.id, "ip": ip_cliente},
                )
                session.commit()
                raise HTTPException(status_code=401, detail="Credenciais inválidas")

            # Registra sucesso no banco (zera tentativas de login)
            session.execute(
                text("""
                INSERT INTO log_acesso (id_usuario, ip_hash, sucesso, motivo_falha)
                VALUES (:id_usr, :ip, true, NULL)
            """),
                {"id_usr": usuario.id, "ip": ip_cliente},
            )
            session.commit()

            # 2. Gera o Token (Identificando o tipo de usuário - RF10)
            token = criar_token_jwt(
                data={"sub": str(usuario.id), "tipo": usuario.tipo_usuario.value}
            )

            usuario_seguro = Usuario_response.model_validate(usuario).model_dump()

            return {
                "access_token": token,
                "token_type": "bearer",
                "usuario": usuario_seguro,
            }

        except HTTPException:
            raise
        except Exception as e:
            session.rollback()
            print(f"ERRO NO LOGIN: {e}")
            raise HTTPException(status_code=500, detail="Erro interno no servidor")
