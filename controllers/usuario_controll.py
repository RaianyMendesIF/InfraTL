from datetime import datetime, timezone
from fastapi import Request, HTTPException
from sqlalchemy import func, text
from sqlalchemy.orm import Session
import re
import hashlib

from models.model import Usuario, Bairro, Endereco, Funcionario
from schemas.usuario_schemas import Usuario_response, Usuario_recuperar_senha, Usuario_redefinir_senha, Usuario_schema_cadastro
from utils.security import criar_token_jwt, token_recuperar_senha, decodificar_token_recuperacao


def gerar_hash_ip(ip: str) -> str:
    """Gera hash SHA-256 do IP (LGPD compliance)"""
    return hashlib.sha256(ip.encode()).hexdigest()


def cadastrar_usuario(dados: Usuario_schema_cadastro, session: Session):
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


def recuperar_senha(dados: Usuario_recuperar_senha, session: Session):
    try:
        usuario = (
            session.query(Usuario).filter(Usuario.email == dados.email).first()
        )
        if usuario:
            # Gera o token de 15 minutos
            token = token_recuperar_senha(usuario.email)
            
            # O link que o seu Front-end vai abrir (exemplo)
            link_recuperacao = f"http://localhost:3000/nova-senha?token={token}"

    except HTTPException:
        raise

    except Exception as e:
        session.rollback()
        print(f"ERRO DE BANCO: {e}")
        raise HTTPException(
            status_code=500, detail=f"Erro interno no banco de dados: {str(e)}"
        )

def redefinir_senha_usuario(dados: Usuario_redefinir_senha, session: Session):
    # 1. Abre o envelope (token) e vê se é válido e se não passou de 15 min
    email = decodificar_token_recuperacao(dados.token)
    
    if not email:
        raise HTTPException(status_code=400, detail="Link de recuperação inválido ou expirado. Solicite um novo.")
        
    # 2. Busca o usuário dono daquele e-mail
    usuario = session.query(Usuario).filter(Usuario.email == email).first()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
    # 3. Usa o método que criamos no Model para atualizar a senha com segurança
    usuario.atualizar_senha(dados.nova_senha)
    
    # 4. Salva no banco!
    session.commit()
    
    return {"mensagem": "Senha atualizada com sucesso! Você já pode fazer login."}


def login_usuario(dados, session: Session, request: Request):
    try:
        email = dados.email
        senha = dados.senha
        usuario = None

        ip_cliente = request.client.host if request and request.client else "0.0.0.0"
        ip_hash = gerar_hash_ip(ip_cliente)

        usuario = session.query(Usuario).filter(Usuario.email == email).first()
        
        if not usuario:
            raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

        agora_utc = datetime.now(timezone.utc)
        # Verifica se o usuário está bloqueado pela trigger do banco
        if usuario.bloqueado_ate and usuario.bloqueado_ate > agora_utc:
            raise HTTPException(
                status_code=403,
                detail="Conta temporariamente bloqueada por múltiplas tentativas falhas."
            )

        senha_valida = usuario.verificar_senha(senha)
        
        if not senha_valida:
            # Registra a falha no banco para disparar a trigger
            session.execute(
                text("""
                INSERT INTO log_acesso (id_usuario, ip_hash, sucesso, motivo_falha)
                VALUES (:id_usr, :ip_hash, false, 'Senha incorreta')
                """),
                {"id_usr": usuario.id, "ip_hash": ip_hash},
            )
            session.commit()
            # Erro padrão genérico (igual ao do e-mail)
            raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

        # Registra sucesso no banco (zera tentativas de login)
        session.execute(
            text("""
            INSERT INTO log_acesso (id_usuario, ip_hash, sucesso, motivo_falha)
            VALUES (:id_usr, :ip_hash, true, NULL)
            """),
            {"id_usr": usuario.id, "ip_hash": ip_hash},
        )
        session.commit()

        # 2. Gera o Token (Identificando o tipo de usuário - RF10)
        tipo = usuario.tipo_usuario.value if hasattr(usuario.tipo_usuario, 'value') else usuario.tipo_usuario
        
        token = criar_token_jwt(
            data={"sub": str(usuario.id), "tipo": tipo}
        )

        # Filtra a senha antes de devolver os dados
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
