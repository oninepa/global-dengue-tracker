import csv
import json
import os

# 1. CSV 타입 수정
types = ['hospital', 'pharmacy', 'vaccine', 'blood_test', 'aid']
with open('sample_data.csv', 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

for i, row in enumerate(rows):
    row['type'] = types[i % len(types)]

with open('sample_data.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

# 2. manifest.json 수정
manifest = {
    "name": "Bangdeng",
    "short_name": "Bangdeng",
    "start_url": "/",
    "display": "standalone",
    "icons": [
        {"src": f"icons/icon-{size}x{size}.png", "sizes": f"{size}x{size}", "type": "image/png"}
        for size in [72, 96, 128, 144, 152, 192, 384, 512]
    ]
}

with open('manifest.json', 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)

print("✅ 완료!")