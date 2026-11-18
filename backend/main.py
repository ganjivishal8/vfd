# backend/main.py
import os
import uuid
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field

from app.database import engine, Base, get_db
from app.models import CatalogDesign, User, MeasurementProfile, Order

# Ensure all database tables exist in boutique.db
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Manya-Sutra Boutique API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- PYDANTIC SCHEMAS ----------------- #

class CatalogItemOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    base_stitching_price: float
    image_url: Optional[str]
    estimated_turnaround_days: int

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    full_name: str
    phone_number: str
    email: Optional[str] = None
    address: Optional[str] = None
    marketing_opt_in: bool = True

class UserOut(BaseModel):
    id: str
    full_name: str
    phone_number: str
    email: Optional[str]
    address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class MeasurementCreate(BaseModel):
    user_id: str
    profile_name: str
    garment_type: str  # Blouse, Kurti, Lehenga, Anarkali
    length: Optional[float] = Field(None, ge=10, le=70, description="Length in inches")
    bust: Optional[float] = Field(None, ge=20, le=60, description="Bust round in inches")
    waist: Optional[float] = Field(None, ge=18, le=60, description="Waist round in inches")
    hip: Optional[float] = Field(None, ge=20, le=70, description="Hip round in inches")
    shoulder: Optional[float] = Field(None, ge=10, le=25, description="Shoulder width in inches")
    arm_hole: Optional[float] = Field(None, ge=10, le=25, description="Arm hole in inches")
    sleeve_length: Optional[float] = Field(None, ge=2, le=35, description="Sleeve length in inches")
    front_neck_depth: Optional[float] = Field(None, ge=3, le=12, description="Front neck depth in inches")
    back_neck_depth: Optional[float] = Field(None, ge=3, le=15, description="Back neck depth in inches")
    special_fit_instructions: Optional[str] = None

class MeasurementOut(BaseModel):
    id: str
    user_id: str
    profile_name: str
    garment_type: str
    length: Optional[float]
    bust: Optional[float]
    waist: Optional[float]
    hip: Optional[float]
    shoulder: Optional[float]
    arm_hole: Optional[float]
    sleeve_length: Optional[float]
    front_neck_depth: Optional[float]
    back_neck_depth: Optional[float]
    special_fit_instructions: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    user_id: str
    design_id: str
    measurement_profile_id: str
    fabric_provided_by_client: bool = True
    customization_notes: Optional[str] = None

class OrderOut(BaseModel):
    id: str
    user_id: str
    design_id: str
    measurement_profile_id: str
    status: str
    stitching_price: float
    total_amount: float
    customization_notes: Optional[str]
    created_at: datetime
    # Nested information for the UI
    design_title: Optional[str] = None
    design_image: Optional[str] = None
    measurement_name: Optional[str] = None
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: str


# ----------------- API ROUTES ----------------- #

@app.get("/")
def home():
    return {
        "status": "online",
        "service": "Manya-Sutra Boutique Backend",
        "database": "SQLite (boutique.db)"
    }

# 1. Catalog Endpoint
@app.get("/api/v1/catalog", response_model=List[CatalogItemOut])
def get_catalog(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(CatalogDesign).filter(CatalogDesign.is_active == True)
    if category and category != "All":
        query = query.filter(CatalogDesign.category.ilike(category))
    return query.all()

# 2. User Registration / Lookup
@app.post("/api/v1/users", response_model=UserOut)
def get_or_create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            full_name=payload.full_name,
            phone_number=payload.phone_number,
            email=payload.email,
            address=payload.address,
            marketing_opt_in=payload.marketing_opt_in
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@app.get("/api/v1/users/by-phone/{phone_number}", response_model=UserOut)
def get_user_by_phone(phone_number: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone_number == phone_number).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return user

# 3. Measurement Vault Endpoints
@app.post("/api/v1/measurements", response_model=MeasurementOut)
def save_measurement_profile(payload: MeasurementCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User does not exist")
    
    new_profile = MeasurementProfile(
        id=str(uuid.uuid4()),
        user_id=payload.user_id,
        profile_name=payload.profile_name,
        garment_type=payload.garment_type,
        length=payload.length,
        bust=payload.bust,
        waist=payload.waist,
        hip=payload.hip,
        shoulder=payload.shoulder,
        arm_hole=payload.arm_hole,
        sleeve_length=payload.sleeve_length,
        front_neck_depth=payload.front_neck_depth,
        back_neck_depth=payload.back_neck_depth,
        special_fit_instructions=payload.special_fit_instructions
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@app.get("/api/v1/measurements/user/{user_id}", response_model=List[MeasurementOut])
def get_user_measurements(user_id: str, db: Session = Depends(get_db)):
    return db.query(MeasurementProfile).filter(MeasurementProfile.user_id == user_id).all()

# ----------------- SPRINT 3: ORDER WORKFLOW APIS ----------------- #

@app.post("/api/v1/orders")
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # Verify design exists
    design = db.query(CatalogDesign).filter(CatalogDesign.id == payload.design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
        
    # Verify measurement profile exists
    measurement = db.query(MeasurementProfile).filter(MeasurementProfile.id == payload.measurement_profile_id).first()
    if not measurement:
        raise HTTPException(status_code=404, detail="Measurement profile not found")

    new_order = Order(
        id=str(uuid.uuid4()),
        user_id=payload.user_id,
        design_id=payload.design_id,
        measurement_profile_id=payload.measurement_profile_id,
        status="ORDER_PLACED",
        stitching_price=design.base_stitching_price,
        total_amount=design.base_stitching_price,
        customization_notes=payload.customization_notes
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return {
        "status": "success",
        "order_id": new_order.id,
        "current_status": new_order.status,
        "total_amount": new_order.total_amount
    }

@app.get("/api/v1/orders/user/{user_id}")
def get_user_orders(user_id: str, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        result.append({
            "id": o.id,
            "status": o.status,
            "total_amount": o.total_amount,
            "customization_notes": o.customization_notes,
            "created_at": o.created_at.strftime("%d %b %Y, %I:%M %p"),
            "design_title": o.design.title if o.design else "Custom Garment",
            "design_image": o.design.image_url if o.design else None,
            "garment_type": o.measurement_profile.garment_type if o.measurement_profile else "Stitching",
            "fit_label": o.measurement_profile.profile_name if o.measurement_profile else "Standard"
        })
    return result

@app.patch("/api/v1/orders/{order_id}/status")
def update_order_status(order_id: str, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return {"status": "success", "order_id": order.id, "new_status": order.status}
