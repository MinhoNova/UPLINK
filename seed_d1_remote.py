import json
import subprocess

# Read db.json
with open('src/data/db.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

success = 0
failed = 0

for key, value in data.items():
    json_str = json.dumps(value, ensure_ascii=False).replace("'", "''")
    sql = f"INSERT INTO kv_store (key, value) VALUES ('{key}', '{json_str}') ON CONFLICT(key) DO UPDATE SET value=excluded.value;"
    cmd = f'npx wrangler d1 execute uplink-db --command "{sql}" --remote'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
    if result.returncode == 0 and '"errors": []' in result.stdout:
        print(f"OK: {key}")
        success += 1
    else:
        print(f"FAIL: {key}")
        failed += 1

print(f"\nSeeded: {success}, Failed: {failed}")
