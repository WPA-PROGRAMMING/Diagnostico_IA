import os
import shutil
import uuid
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from . import models, schemas, database
from passlib.context import CryptContext
from jose import JWTError, jwt

# --- CONFIGURACIÓN ---
SECRET_KEY = "tu_clave_super_secreta"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
UPLOAD_DIR = "uploaded_images"

os.makedirs(UPLOAD_DIR, exist_ok=True)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Medical Assistant AI API")

# --- CORS (Actualizado para Next.js) ---
origins = [
    "http://localhost:5173",    # Puerto de Vite (El que estás usando ahora)
    "http://127.0.0.1:5173",    # La versión numérica
    "http://localhost:3000",    # (Opcional) Déjalo si piensas usar Next.js después
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

# ... (Las funciones verify_password, get_password_hash, create_access_token, get_current_user NO CAMBIAN) ...
# Copia esas funciones del código anterior o déjalas como están si ya las tienes.
# Solo pondré los cambios en los ENDPOINTS abajo:

# --- FUNCIONES AUXILIARES REPETIDAS (Para que el código esté completo si copias y pegas) ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- ENDPOINTS ---

@app.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    hashed_pw = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- ENDPOINT PREDICT ACTUALIZADO ---
@app.post("/predict", response_model=schemas.DiagnosisOut)
async def predict_condition(
    file: UploadFile = File(...),
    # Recibimos los nuevos campos como Form Data
    patientName: str = Form(...), 
    nss: str = Form(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # 1. Guardar archivo
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_location = f"{UPLOAD_DIR}/{unique_filename}"
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 2. Simulación IA
    is_pneumonia = "neu" in file.filename.lower()
    prediction_text = "Neumonía Detectada" if is_pneumonia else "Condición Normal"
    confidence_score = "94.5%" if is_pneumonia else "98.2%"
    
    # 3. Guardar en BD con los nuevos campos
    new_diagnosis = models.DiagnosisHistory(
        filename=unique_filename,
        prediction=prediction_text,
        confidence=confidence_score,
        patient_name=patientName, # Guardamos nombre
        nss=nss,                  # Guardamos NSS
        user_id=current_user.id 
    )
    
    db.add(new_diagnosis)
    db.commit()
    db.refresh(new_diagnosis)
    
    return new_diagnosis

@app.get("/history", response_model=List[schemas.DiagnosisOut])
def get_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    return current_user.diagnoses