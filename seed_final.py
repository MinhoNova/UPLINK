import json, subprocess, sys

data = json.load(open('src/data/db.json', 'r', encoding='utf-8'))

ok = 0
fail = 0

for key, value in data.items():
    j = json.dumps(value, ensure_ascii=False).replace("'", "''")
    sql = f"INSERT INTO kv_store (key, value) VALUES ('{key}', '{j}') ON CONFLICT(key) DO UPDATE SET value=excluded.value;"
    r = subprocess.run(['npx', 'wrangler', 'd1', 'execute', 'uplink-db', '--command', sql, '--remote'], capture_output=True, text=True, timeout=30)
    if r.returncode == 0 and '"errors": []' in r.stdout:
        ok += 1
    else:
        fail += 1
        print(f'FAIL: {key}')

print(f'Done: {ok} ok, {fail} fail')
