import json
import subprocess
import sys

# Read db.json
with open("src/data/db.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Execute SQL for each key-value pair
for key, value in data.items():
    sql = f"INSERT INTO kv_store (key, value) VALUES ('{key}', '{json.dumps(value)}') ON CONFLICT(key) DO UPDATE SET value=excluded.value;"
    result = subprocess.run(
        ["npx", "wrangler", "d1", "execute", "uplink-db", "--command", sql, "--remote"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"Error seeding {key}: {result.stderr}")
    else:
        print(f"Seeded: {key}")

print("Done!")
