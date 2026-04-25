from models.car import Car  
  
  
class CarController:  
    @classmethod  
    async def get(cls) -> Car:  
        return Car(id="1", name="BMW")