# Seeds the remote D1 database from src/data/db.json
# Run: python seed_d1.py

import json
import subprocess
import sys
import os

DB_NAME = "uplink-db"
DB_ID = "779b2a59-50c9-4378-bfa9-b6d96ac4d692"

def run_sql(sql):
    """Execute a single SQL statement against remote D1"""
    cmd = ["npx", "wrangler", "d1", "execute", DB_NAME, "--command", sql, "--remote"]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return result.returncode == 0

def main():
    db_path = os.path.join(os.path.dirname(__file__), "src", "data", "db.json")
    with open(db_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    success = 0
    failed = 0
    
    for key, value in data.items():
        # Serialize and escape for SQL
        json_str = json.dumps(value, ensure_ascii=False)
        # Escape single quotes for SQL
        json_str = json_str.replace("'", "''")
        # Escape backslashes for SQL
        json_str = json_str.replace("\\", "\\\\")
        
        sql = f"INSERT INTO kv_store (key, value) VALUES ('{key}', '{json_str}') ON CONFLICT(key) DO UPDATE SET value=excluded.value;"
        
        if run_sql(sql):
            success += 1
            print(f"✓ {key}")
        else:
            failed += 1
            print(f"✗ {key}")
    
    print(f"\nDone: {success} seeded, {failed} failed")

if __name__ == "__main__":
    main()
