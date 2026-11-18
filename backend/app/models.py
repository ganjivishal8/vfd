# app/models.py
import uuid
from sqlalchemy import Column, String, Float, Boolean, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(120), nullable=False)
    phone_number = Column(String(15), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True)
    address = Column(Text, nullable=True)
    marketing_opt_in = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    measurements = relationship("MeasurementProfile", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")


class CatalogDesign(Base):
    __tablename__ = "catalog_designs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)  # Blouse, Kurti, Lehenga, Salwar
    base_stitching_price = Column(Float, nullable=False)
    image_url = Column(Text, nullable=True)
    estimated_turnaround_days = Column(Integer, default=7)
    is_active = Column(Boolean, default=True)

    orders = relationship("Order", back_populates="design")


class MeasurementProfile(Base):
    __tablename__ = "measurement_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    profile_name = Column(String(60), nullable=False)  # e.g., 'Anu - Heavy Blouse', 'Mom Kurti'
    garment_type = Column(String(50), nullable=False)   # 'Blouse', 'Kurti', 'Lehenga'

    # Dimensions in inches
    length = Column(Float, nullable=True)
    bust = Column(Float, nullable=True)
    waist = Column(Float, nullable=True)
    hip = Column(Float, nullable=True)
    shoulder = Column(Float, nullable=True)
    arm_hole = Column(Float, nullable=True)
    sleeve_length = Column(Float, nullable=True)
    front_neck_depth = Column(Float, nullable=True)
    back_neck_depth = Column(Float, nullable=True)
    special_fit_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="measurements")
    orders = relationship("Order", back_populates="measurement_profile")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    design_id = Column(String(36), ForeignKey("catalog_designs.id"), nullable=False)
    measurement_profile_id = Column(String(36), ForeignKey("measurement_profiles.id"), nullable=False)

    status = Column(String(50), default="ORDER_PLACED", index=True)
    stitching_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    customization_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    design = relationship("CatalogDesign", back_populates="orders")
    measurement_profile = relationship("MeasurementProfile", back_populates="orders")
