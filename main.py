# main.py
from fastapi import FastAPI
from models.model import Base, db
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://loclhost:8000",
    "http://127.0.0.1:8000"
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar todas as tabelas no banco de dados
Base.metadata.create_all(bind=db)

from views.ocorrencia.admin import router_occurrence_admin
from views.ocorrencia.public import router_occurrence_public
from views.auth.login import router_login
from views.auth.signup import router_signup
  

  
app.include_router(router_occurrence_admin)  
app.include_router(router_occurrence_public)  
app.include_router(router_signup)  
app.include_router(router_login)  
  
if __name__ == "__main__":  
    import uvicorn  
  
    uvicorn.run(app, host="localhost", port=8000)