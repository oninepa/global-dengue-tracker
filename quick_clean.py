import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("bangdeng-key.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
docs = db.collection('locations').stream()
for doc in docs:
    doc.reference.delete()
print("✅ 기존 임시 데이터 삭제 완료!")