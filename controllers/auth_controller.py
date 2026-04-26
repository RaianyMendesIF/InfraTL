import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext
from jose import jwt


SECRET_KEY = os.getenv("SECRET_KEY", "TROQUE_EM_PRODUCAO")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Contexto de criptografia bcrypt
# O banco rejeita qualquer valor que não seja hash bcrypt válido
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_ip(ip: str) -> str:
    """
    Gera hash SHA-256 do IP do cliente.
    Não armazenamos o IP direto no banco — segue a LGPD (RNF06).
    """
    return hashlib.sha256(ip.encode()).hexdigest()


def verificar_senha(senha_pura: str, senha_hash: str) -> bool:
    """
    Compara a senha digitada com o hash bcrypt armazenado no banco.
    O bcrypt nunca reverte o hash — reprocessa a senha e compara.
    Retorna True se baterem, False caso contrário.
    """
    return pwd_context.verify(senha_pura, senha_hash)


def gerar_hash_senha(senha: str) -> str:
    """
    Gera hash bcrypt de uma senha pura.
    Deve ser chamado no cadastro antes de qualquer INSERT no banco.
    Nunca armazene senha em texto puro.
    """
    return pwd_context.hash(senha)


def criar_access_token(dados: dict) -> str:
    """
    Gera um JWT assinado com SECRET_KEY.

    O token carrega:
      - 'sub':  e-mail do usuário (identificador)
      - 'tipo': tipo_usuario (Cidadao, Agente ou Gestor)
      - 'id':   id do usuário no banco
      - 'exp':  timestamp de expiração

    O front-end usa 'tipo' para redirecionar após o login:
      - Cidadao → tela de ocorrências
      - Agente / Gestor → dashboard da prefeitura (RF10)
    """
    payload = dados.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def detectar_tipo_credencial(credencial: str) -> str:
    """
    Detecta o formato da credencial para saber como buscar no banco.

    Regras:
      - 11 dígitos numéricos → CPF   (cidadão)
      - contém '@'           → email (cidadão)
      - qualquer outro       → matrícula (funcionário)

    Retorna: 'cpf' | 'email' | 'matricula'

    Permite que o front-end use um campo único de login
    para os três tipos de usuário (SCRUM-2).
    """
    limpa = credencial.strip()
    if limpa.isdigit() and len(limpa) == 11:
        return "cpf"
    if "@" in limpa:
        return "email"
    return "matricula"


def verificar_bloqueio(db: Session, id_usuario: int):
    """
    Verifica se a conta está bloqueada por excesso de tentativas.

    O trigger fn_controle_tentativas_login no banco bloqueia
    automaticamente após 5 falhas consecutivas por 15 minutos.
    Esta função apenas consulta o resultado desse trigger.

    Lança HTTP 429 se a conta ainda estiver bloqueada.
    """
    resultado = db.execute(
        text("SELECT bloqueado_ate FROM usuario WHERE id = :id"), {"id": id_usuario}
    ).fetchone()

    if resultado and resultado.bloqueado_ate:
        if resultado.bloqueado_ate > datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Conta bloqueada por excesso de tentativas. "
                    f"Tente novamente após {resultado.bloqueado_ate.strftime('%H:%M')} UTC."
                ),
            )


def registrar_log(
    db: Session,
    id_usuario: Optional[int],
    ip: str,
    sucesso: bool,
    motivo: Optional[str] = None,
):
    """
    Registra tentativa de login na tabela log_acesso.

    O trigger fn_controle_tentativas_login lê esta tabela e:
      - Incrementa tentativas_login em caso de falha
      - Bloqueia a conta na 5ª falha consecutiva
      - Zera o contador em caso de sucesso

    O IP é armazenado como hash SHA-256 (LGPD).
    """
    db.execute(
        text(
            """
            INSERT INTO log_acesso (id_usuario, ip_hash, sucesso, motivo_falha)
            VALUES (:id, :ip, :sucesso, :motivo)
        """
        ),
        {"id": id_usuario, "ip": hash_ip(ip), "sucesso": sucesso, "motivo": motivo},
    )
    db.commit()


def autenticar_usuario(db: Session, credencial: str, senha: str, ip: str) -> dict:
    """
    Lógica central do login unificado (SCRUM-2).

    Fluxo:
      1. Detecta o tipo da credencial (email, CPF ou matrícula)
      2. Busca o usuário no banco pela credencial correta
      3. Verifica bloqueio por força bruta
      4. Valida a senha com bcrypt
      5. Registra o resultado no log_acesso
      6. Retorna os dados do usuário autenticado

    Retorna: dict com id, nome, email, tipo_usuario
    Lança:
      HTTP 401 → credenciais inválidas
      HTTP 403 → conta desativada
      HTTP 429 → conta bloqueada (muitas tentativas)
    """
    tipo_credencial = detectar_tipo_credencial(credencial)

    # Mensagem genérica para os dois casos de erro (usuário não existe
    # e senha errada) — evita revelar quais credenciais existem no banco
    # (proteção contra user enumeration attack)
    erro_generico = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    usuario = None

    # Busca por CPF — cidadão
    if tipo_credencial == "cpf":
        usuario = db.execute(
            text(
                """
                SELECT u.id, u.nome, u.email, u.senha_hash,
                       u.tipo_usuario, u.ativo, u.bloqueado_ate
                FROM usuario u
                JOIN cidadao c ON c.id_usuario = u.id
                WHERE c.cpf = :credencial
            """
            ),
            {"credencial": credencial.strip()},
        ).fetchone()

    # Busca por e-mail — cidadão
    elif tipo_credencial == "email":
        usuario = db.execute(
            text(
                """
                SELECT id, nome, email, senha_hash,
                       tipo_usuario, ativo, bloqueado_ate
                FROM usuario
                WHERE email = :credencial
                  AND tipo_usuario = 'Cidadao'
            """
            ),
            {"credencial": credencial.strip()},
        ).fetchone()

    # Busca por matrícula — funcionário (Agente ou Gestor)
    else:
        usuario = db.execute(
            text(
                """
                SELECT u.id, u.nome, u.email, u.senha_hash,
                       u.tipo_usuario, u.ativo, u.bloqueado_ate
                FROM usuario u
                JOIN funcionario f ON f.id_usuario = u.id
                WHERE f.matricula = :credencial
            """
            ),
            {"credencial": credencial.strip()},
        ).fetchone()

    # Usuário não encontrado
    if not usuario:
        registrar_log(db, None, ip, False, f"{tipo_credencial}_nao_encontrado")
        raise erro_generico

    # Conta bloqueada
    verificar_bloqueio(db, usuario.id)

    # Senha incorreta
    if not verificar_senha(senha, usuario.senha_hash):
        registrar_log(db, usuario.id, ip, False, "senha_incorreta")
        raise erro_generico

    # Conta desativada pelo administrador
    if not usuario.ativo:
        registrar_log(db, usuario.id, ip, False, "conta_inativa")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta desativada. Entre em contato com a prefeitura.",
        )

    # Sucesso
    registrar_log(db, usuario.id, ip, True)

    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "tipo_usuario": usuario.tipo_usuario,
    }


def fazer_logout(db: Session, id_usuario: int):
    """
    Revoga todos os refresh tokens ativos do usuário no banco.

    O JWT de curta duração (30 min) ainda é tecnicamente válido
    até expirar, mas o usuário não consegue renovar a sessão.
    """
    db.execute(
        text(
            """
            UPDATE refresh_token
            SET revogado = TRUE, revogado_em = NOW()
            WHERE id_usuario = :id AND revogado = FALSE
        """
        ),
        {"id": id_usuario},
    )
    db.commit()
