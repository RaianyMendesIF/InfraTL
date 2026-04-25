from pydantic import BaseModel  
  
  
class Car(BaseModel):  
    id: str  
    name: str