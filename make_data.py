import csv
from random import uniform

# 50개 임의 데이터 생성
data = [["name", "address", "lat", "lng", "type"]]
for i in range(1, 51):
    lat, lng = uniform(23.0, 24.0), uniform(90.0, 92.0)  # 방글라데시 좌표 범위
    data.append([
        f"Location {i}",
        f"Address {i}",
        round(lat, 4),
        round(lng, 4),
        "hospital" if i % 3 == 0 else "pharmacy" if i % 2 == 0 else "aid"
    ])

# CSV 저장
with open("data/sample_data.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerows(data)
print("※ 50개 데이터 생성 완료 ※")