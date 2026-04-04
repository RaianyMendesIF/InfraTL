# main.py
from fastapi import FastAPI  
app = FastAPI()  
 
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