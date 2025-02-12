from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

app = FastAPI()

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Veritabanı bağlantısı
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://trivy_user:trivy_password@db:5432/trivy_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# SQLAlchemy modeli
Base = declarative_base()

class ScanResultDB(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    image_name = Column(String)
    scan_time = Column(DateTime)
    vulnerabilities = Column(JSON)

# Veritabanı tablosunu oluştur
Base.metadata.create_all(bind=engine)

class ScanResult(BaseModel):
    image_name: str
    scan_time: datetime
    vulnerabilities: List[Dict[Any, Any]]
    
    class Config:
        max_anystr_length = 1024 * 1024 * 50
        arbitrary_types_allowed = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/scan-results")
async def add_scan_result(scan_result: ScanResult):
    db = SessionLocal()
    try:
        db_scan_result = ScanResultDB(
            image_name=scan_result.image_name,
            scan_time=scan_result.scan_time,
            vulnerabilities=json.loads(json.dumps(scan_result.vulnerabilities))
        )
        db.add(db_scan_result)
        db.commit()
        return {"message": "Scan result added successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/api/scan-results")
async def get_scan_results():
    db = SessionLocal()
    try:
        results = db.query(ScanResultDB).order_by(ScanResultDB.scan_time.desc()).all()
        return [
            {
                "image_name": result.image_name,
                "scan_time": result.scan_time,
                "vulnerabilities": result.vulnerabilities
            }
            for result in results
        ]
    finally:
        db.close()