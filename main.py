# main.py
from fastapi import FastAPI  
  
from views.car_view import router_car  
  
app = FastAPI()  
  
app.router.include_router(router_car, prefix="/api/v1", tags=["car"])  
  
if __name__ == "__main__":  
    import uvicorn  
  
    uvicorn.run(app, host="localhost", port=8000)