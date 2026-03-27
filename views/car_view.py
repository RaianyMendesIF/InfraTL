from fastapi import APIRouter  
  
from controllers.car_controller import CarController  
from models.car import Car  
  

router_car = APIRouter()  
  

@router_car.get("/car", response_model=Car, summary="Get car")  
async def get_todos() -> Car:  
    return await CarController().get()