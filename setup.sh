#!/bin/bash

# =============================================================
#  InfraTL — Script de instalação e execução
#  Testado em Ubuntu 22.04+
#  Uso: chmod +x setup.sh && ./setup.sh
# =============================================================

set -e  # Para imediatamente se qualquer comando falhar

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem cor

echo ""
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}   InfraTL — Sistema de Zeladoria Urbana        ${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""

# ── 1. Verifica dependências do sistema ──────────────────────

echo -e "${YELLOW}[1/6] Verificando dependências do sistema...${NC}"

if ! command -v python3 &>/dev/null; then
    echo "Python3 não encontrado. Instalando..."
    sudo apt-get update -qq
    sudo apt-get install -y python3 python3-pip python3-venv
fi

if ! command -v node &>/dev/null; then
    echo "Node.js não encontrado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v npm &>/dev/null; then
    echo "npm não encontrado. Instalando..."
    sudo apt-get install -y npm
fi

echo -e "${GREEN}✔ Python3: $(python3 --version)${NC}"
echo -e "${GREEN}✔ Node.js: $(node --version)${NC}"
echo -e "${GREEN}✔ npm: $(npm --version)${NC}"

# ── 2. Configura o arquivo .env ──────────────────────────────

echo ""
echo -e "${YELLOW}[2/6] Verificando arquivo .env...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${RED}⚠ Arquivo .env criado a partir do .env.example.${NC}"
        echo -e "${RED}  Edite o arquivo .env com as credenciais reais antes de continuar.${NC}"
        echo ""
        echo -e "  Abra o arquivo com: ${YELLOW}nano .env${NC}"
        echo ""
        read -p "Pressione ENTER após editar o .env para continuar..."
    else
        echo -e "${RED}ERRO: Nenhum arquivo .env ou .env.example encontrado.${NC}"
        echo "Crie o arquivo .env com as seguintes variáveis:"
        echo ""
        echo "  DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require"
        echo "  SECRET_KEY=sua_chave_secreta_aqui"
        echo "  EMAIL_REMETENTE_env=seu@email.com"
        echo "  EMAIL_SENHA_APP_env=sua_senha_de_app"
        echo "  FRONTEND_URL=http://localhost:5173"
        echo ""
        exit 1
    fi
else
    echo -e "${GREEN}✔ Arquivo .env encontrado.${NC}"
fi

# ── 3. Configura o backend (Python/FastAPI) ──────────────────

echo ""
echo -e "${YELLOW}[3/6] Configurando o backend (FastAPI)...${NC}"

# Cria o ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual Python..."
    python3 -m venv venv
fi

# Ativa o ambiente virtual
source venv/bin/activate

# Instala as dependências
echo "Instalando dependências Python..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo -e "${GREEN}✔ Backend configurado.${NC}"

# ── 4. Configura o frontend (React/Vite) ─────────────────────

echo ""
echo -e "${YELLOW}[4/6] Configurando o frontend (React)...${NC}"

cd frontend
npm install --silent
cd ..

echo -e "${GREEN}✔ Frontend configurado.${NC}"

# ── 5. Inicia o backend em background ────────────────────────

echo ""
echo -e "${YELLOW}[5/6] Iniciando o backend...${NC}"

source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Aguarda o backend subir
echo "Aguardando o backend inicializar..."
sleep 4

# Verifica se o backend está respondendo
if curl -s http://localhost:8000/docs > /dev/null; then
    echo -e "${GREEN}✔ Backend rodando em http://localhost:8000${NC}"
    echo -e "${GREEN}  Documentação da API: http://localhost:8000/docs${NC}"
else
    echo -e "${RED}✘ Backend não respondeu. Verifique o arquivo .env e tente novamente.${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# ── 6. Inicia o frontend ──────────────────────────────────────

echo ""
echo -e "${YELLOW}[6/6] Iniciando o frontend...${NC}"

cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 3

echo ""
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}   ✔ InfraTL está rodando!                      ${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""
echo -e "  Frontend: ${YELLOW}http://localhost:5173${NC}"
echo -e "  Backend:  ${YELLOW}http://localhost:8000${NC}"
echo -e "  API Docs: ${YELLOW}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}  Pressione Ctrl+C para encerrar ambos os serviços.${NC}"
echo ""

# Mantém o script rodando e encerra tudo junto com Ctrl+C
trap "echo ''; echo 'Encerrando...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait