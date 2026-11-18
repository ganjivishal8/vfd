# app/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Uses local SQLite file; when migrating to Postgres later, only change this string!
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./boutique.db")

# check_same_thread=False is required for SQLite to handle multi-threaded FastAPI requests
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
