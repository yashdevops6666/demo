from sqlalchemy import Column, String, Date, Integer, func
from database import Base

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    ip_address = Column(String(64), nullable=False, index=True)
    used_date  = Column(Date, nullable=False, default=func.current_date())
