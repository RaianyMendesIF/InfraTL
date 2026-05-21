import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import pegar_sessao
from models.model import Usuario
from passlib.context import CryptContext
import smtplib
from email.message import EmailMessage


# Em produção, coloque isso no seu arquivo .env!
SECRET_KEY = "chave_super_secreta_infratl"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
EMAIL_REMETENTE = "naoresponder.infratl@gmail.com"
EMAIL_SENHA_APP = "onns cjps tano eglk"
URL_FRONTEND_RECUPERACAO = "link do front"


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def criar_token_jwt(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def token_recuperar_senha(email: str):
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    dados = {"sub": email, "tipo": "reset", "exp": expire}
    
    return jwt.encode(dados, SECRET_KEY, algorithm=ALGORITHM)


def decodificar_token_recuperacao(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("tipo") != "reset":
            return None
        return payload.get("sub") # Retorna o e-mail que estava dentro do token
    except jwt.ExpiredSignatureError:
        return None # Token passou dos 15 minutos
    except jwt.InvalidTokenError:
        return None # Token falso/alterado

def get_current_user(
    token: str = Depends(oauth2_scheme), session: Session = Depends(pegar_sessao)
):
    credenciais_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id: str = payload.get("sub")
        if usuario_id is None:
            raise credenciais_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão expirada. Faça login novamente.",
        )
    except jwt.InvalidTokenError:
        raise credenciais_exception

    usuario = session.query(Usuario).filter(Usuario.id == int(usuario_id)).first()
    if usuario is None or not usuario.ativo:
        raise credenciais_exception

    return usuario


def get_current_admin(current_user: Usuario = Depends(get_current_user)):
    # Identifica o tipo de usuário (RF10) e bloqueia se não for admin
    if current_user.tipo_usuario.value != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Rota restrita para funcionários.",
        )
    return current_user


def enviar_email_recuperacao(email_destino: str, link_recuperacao: str):
    
    msg = EmailMessage()
    msg['Subject'] = 'Recuperação de Senha - InfraTL'
    msg['From'] = EMAIL_REMETENTE
    msg['To'] = email_destino
    
    conteudo = f"""
    Olá!
    
    Você solicitou a recuperação de senha no nosso sistema.
    Acesse o link abaixo para criar uma nova senha. Este link é válido por 15 minutos.
    
    {link_recuperacao}
    
    Se você não solicitou isso, por favor ignore este e-mail.
    """
    msg.set_content(conteudo)
    
    try:
        # Conecta no servidor SMTP do Gmail na porta 587 (padrão de segurança)
        with smtplib.SMTP('smtp.gmail.com', 587) as servidor:
            servidor.starttls() # Inicia a criptografia da conexão
            servidor.login(EMAIL_REMETENTE, EMAIL_SENHA_APP) # Faz o login
            servidor.send_message(msg) # Dispara a carta
            print(f"E-mail enviado com sucesso para {email_destino}")
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
