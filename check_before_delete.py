import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("bangdeng-key.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
docs = list(db.collection('locations').stream())

print(f"🔍 현재 Firestore에 {len(docs)}개 데이터가 있습니다.")
print("처음 3개 미리보기:")
for i, doc in enumerate(docs[:3]):
    data = doc.to_dict()
    print(f"{i+1}. {data.get('name')} - {data.get('type')}")

answer = input("\n정말 모두 삭제하시겠습니까? (yes/no): ")
if answer.lower() == 'yes':
    for doc in docs:
        doc.reference.delete()
    print("✅ 삭제 완료!")
else:
    print("❌ 취소되었습니다.")