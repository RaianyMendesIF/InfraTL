# InfraTL — Sistema Inteligente de Zeladoria Urbana

Sistema web para gestão de ocorrências e zeladoria urbana do município de Três Lagoas - MS. Permite que cidadãos registrem problemas urbanos e que funcionários da prefeitura acompanhem, avaliem e resolvam as solicitações.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Execução Rápida (Recomendado)](#execução-rápida-recomendado)
- [Execução Manual](#execução-manual)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Rotas da API](#rotas-da-api)
- [Tipos de Usuário e Permissões](#tipos-de-usuário-e-permissões)
- [Fluxo de uma Ocorrência](#fluxo-de-uma-ocorrência)

---

## Visão Geral

O InfraTL é composto por:

- **Backend** — API REST desenvolvida em FastAPI (Python), com banco de dados PostgreSQL hospedado no Neon. Implementa autenticação JWT, controle de acesso por perfil, proteção contra força bruta e notificações por e-mail.
- **Frontend** — Interface web desenvolvida em React com Vite e Tailwind CSS. Adapta o menu e as funcionalidades de acordo com o tipo de usuário logado.

---

## Importante para cadastrar

- Temos alguns bairros pre-definidos, utilize o bairro "Centro" para realizar o cadastro.
- "fonte_localizacao": deixe como "manual"

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Uvicorn |
| Banco de dados | PostgreSQL (Neon — cloud) |
| Frontend | React 18, Vite, Tailwind CSS |
| Autenticação | JWT (PyJWT), bcrypt |
| E-mail | SMTP Gmail |

---

## Pré-requisitos

- Python 3.11 ou superior
- Node.js 18 ou superior
- npm
- Credenciais de acesso ao banco de dados (fornecidas pelo time)

---

## Configuração do Ambiente

Antes de rodar o projeto, configure o arquivo `.env` na raiz do repositório.

**1. Copie o arquivo de exemplo:**
```bash
cp .env.example .env
```

**2. Preencha as variáveis:**
```env
DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
SECRET_KEY=sua_chave_secreta_aqui_minimo_32_caracteres
EMAIL_REMETENTE_env=seuemail@gmail.com
EMAIL_SENHA_APP_env=sua_senha_de_app_gmail
FRONTEND_URL=http://localhost:5173
```

> **Atenção:** o banco de dados está hospedado no Neon (cloud). Não é necessário instalar PostgreSQL localmente — basta preencher a `DATABASE_URL` com as credenciais fornecidas.

---

## Execução Rápida (Recomendado)

Para Linux/Ubuntu, um script automatiza toda a instalação e execução:

```bash
chmod +x setup.sh
./setup.sh
```

O script irá:
1. Verificar e instalar Python3, Node.js e npm se necessário
2. Verificar o arquivo `.env` (cria a partir do `.env.example` se não existir)
3. Criar o ambiente virtual Python e instalar as dependências do backend
4. Instalar as dependências do frontend
5. Iniciar o backend e o frontend simultaneamente

Após a execução, acesse:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8000
- **Documentação da API:** http://localhost:8000/docs

Para encerrar, pressione `Ctrl+C`.

---

## Execução Manual

Se preferir rodar cada parte separadamente:

### Backend

```bash
# Na raiz do projeto
python3 -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

pip install -r requirements.txt
uvicorn main:app --reload
```

O backend estará disponível em `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

---

## Estrutura do Projeto

```
InfraTL/
├── controllers/          # Lógica de negócio
│   ├── auth_controller.py
│   ├── dashboard_controll.py
│   ├── funcionario_controll.py
│   ├── ocorrencia_controll.py
│   ├── servico_controll.py
│   └── usuario_controll.py
├── models/
│   └── model.py          # Modelos SQLAlchemy
├── schemas/              # Validação de dados (Pydantic)
├── utils/
│   └── security.py       # JWT, autenticação, e-mail
├── views/                # Rotas da API (FastAPI routers)
│   ├── Bairros/
│   ├── Dashboard/
│   ├── Funcionario/
│   ├── Ocorrencia/
│   ├── Servico/
│   └── Usuario/
├── frontend/             # Aplicação React
│   └── src/
│       ├── api.js        # Utilitário central de chamadas à API
│       ├── App.jsx       # Roteamento e controle de telas
│       └── components/   # Componentes da interface
├── database.py           # Conexão com o banco
├── main.py               # Ponto de entrada da API
├── requirements.txt      # Dependências Python
├── .env.example          # Modelo de variáveis de ambiente
└── setup.sh              # Script de instalação e execução
```

---

## Rotas da API

A documentação interativa completa está disponível em `http://localhost:8000/docs` após iniciar o backend.

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/cadastrar` | Cadastro de novo cidadão |
| POST | `/auth/conectar` | Login (retorna token JWT) |
| POST | `/auth/recuperar_senha` | Solicita link de recuperação por e-mail |
| POST | `/auth/redefinir_senha` | Redefine a senha com token |

### Ocorrências
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/ocorrencia/cadastrar` | Usuário logado | Registra nova ocorrência |
| GET | `/ocorrencia/minhas` | Cidadão | Lista ocorrências do usuário logado |
| GET | `/ocorrencia/listar` | Funcionário | Lista todas as ocorrências |
| PATCH | `/ocorrencia/{id}/avaliar` | Funcionário | Aprova ou arquiva uma ocorrência |
| PATCH | `/ocorrencia/{id}/status` | Funcionário | Atualiza status (Em Execução / Finalizado) |

### Outros
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/bairros/listar` | Usuário logado | Lista bairros cadastrados |
| GET | `/servico/listar_ativos` | Usuário logado | Lista serviços disponíveis |
| GET | `/dashboard/indicadores` | Gestor | Indicadores consolidados |
| GET | `/funcionario/listar` | Funcionário | Lista funcionários |
| POST | `/funcionario/adicionar` | Funcionário | Promove usuário a funcionário |
| DELETE | `/funcionario/remover` | Funcionário | Remove privilégios de funcionário |

---

## Tipos de Usuário e Permissões

| Funcionalidade | Cidadão | Funcionário |
|---|:---:|:---:|
| Registrar ocorrência | ✔ | ✔ |
| Ver suas ocorrências | ✔ | ✔ |
| Ver todas as ocorrências | — | ✔ |
| Avaliar ocorrências | — | ✔ |
| Atualizar status | — | ✔ |
| Ordens de Serviço | — | ✔ |
| Relatórios | — | ✔ |
| Gestão de equipe | — | ✔ |
| Dashboard com indicadores | — | ✔ (Gestor) |

---

## Fluxo de uma Ocorrência

```
Cidadão registra
      ↓
  Em Análise  ←── estado inicial
      ↓
  Agente avalia
      ↓
 ┌────┴────┐
 ↓         ↓
Pendente  Arquivado
 ↓
Em Execução
 ↓
Finalizado
```

---

> Projeto desenvolvido para a disciplina de Análise e Desenvolvimento de Sistemas — IFMS Campus Três Lagoas.
