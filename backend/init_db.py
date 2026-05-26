from database import engine, Base
import models
import utils

logger = utils.setup_logger("db_init")

def init_db():
    logger.info("Creating MedSentinel database tables...")
    # This will create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    logger.info("Tables created successfully in PostgreSQL!")

if __name__ == "__main__":
    init_db()