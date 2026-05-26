import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Replace 'your_password' with the actual password you use for PostgreSQL
try:
    # Connect to the default 'postgres' database first
    conn = psycopg2.connect(
        user="postgres",
        password="neuro123",  # <--- CHANGE THIS TO YOUR DB PASSWORD
        host="localhost",
        port="5432",
        database="postgres"
    )
    
    # Must set autocommit to create a database
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Create the medsentinel database
    cursor.execute('CREATE DATABASE medsentinel;')
    print("✅ Database 'medsentinel' created successfully!")
    
except psycopg2.errors.DuplicateDatabase:
    print("⚠️ Database 'medsentinel' already exists.")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()