import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

database_url = os.getenv("DATABASE_URL")
if database_url:
    # Some hosted Postgres providers still issue the legacy URL scheme.
    if database_url.startswith("postgres://"):
        database_url = "postgresql+psycopg://" + database_url[len("postgres://"):]
    elif database_url.startswith("postgresql://"):
        database_url = "postgresql+psycopg://" + database_url[len("postgresql://"):]
else:
    # Vercel's function filesystem is ephemeral. Use /tmp so the function can
    # start without external storage, but configure DATABASE_URL for persistence.
    database_url = "sqlite:////tmp/machinepred.db" if os.getenv("VERCEL") else "sqlite:///./machinepred.db"

engine_options = {"pool_pre_ping": True}
if database_url.startswith("sqlite:"):
    engine_options["connect_args"] = {"check_same_thread": False}
engine = create_engine(database_url, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
