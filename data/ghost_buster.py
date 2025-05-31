# ghost_buster.py
import firebase_admin
from firebase_admin import credentials, firestore
import csv

# Firebase 초기화
cred = credentials.Certificate("../bangdeng-key.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()

# 컬렉션 완전 삭제
print("👻 귀신 퇴치 중...")
docs = db.collection('locations').stream()
for doc in docs:
    doc.reference.delete()

# 새 데이터 업로드
with open('bangladesh_expanded_data.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    for row in reader:
        db.collection('locations').add({
            'name': row['name'],
            'address': row['address'], 
            'lat': float(row['lat']),
            'lng': float(row['lng']),
            'type': row['type']
        })
        print(f"✅ {row['name']}")

print("👻➡️💨 귀신 퇴치 완료!")