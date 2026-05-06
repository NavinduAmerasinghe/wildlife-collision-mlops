from db.mongo_client import get_database

db = get_database()

if db is not None:
    print("[SUCCESS] Database connected")
    print("Database name:", db.name)
else:
    print("[FAILED] Could not connect")