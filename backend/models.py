from sqlalchemy import Column, Integer, String, Text, DateTime, func
try: from .database import Base
except ImportError: from database import Base

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    config = Column(Text, nullable=False)
    rows = Column(Text, nullable=False)
