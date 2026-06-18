# main.py
from fastapi import FastAPI
from models.model import Base
from fastapi.middleware.cors import CORSMiddleware
from database import engine


from views.Usuario.usuario import router_usuario
from views.Ocorrencia.ocorrencia import router_ocorrencia
from views.Funcionario.funcionario import router_funcionario
from views.Bairros.bairros import router_bairros
from views.Servico.servico import router_servico
from views.Usuario.cidadao import router_cidadao
from views.Dashboard.dashboard import router_dashboard

origins = ["http://localhost:8000", "http://127.0.0.1:8000"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar todas as tabelas no banco de dados
# Base.metadata.create_all(bind=engine)

app.include_router(router_usuario)
app.include_router(router_ocorrencia)
app.include_router(router_funcionario)
app.include_router(router_bairros)
app.include_router(router_servico)
app.include_router(router_cidadao)
app.include_router(router_dashboard)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8000)
