from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Schemas de Diagnóstico Actualizados ---
class DiagnosisBase(BaseModel):
    filename: str
    prediction: str
    confidence: str
    patient_name: str  # Nuevo
    nss: str           # Nuevo

class DiagnosisOut(DiagnosisBase):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True