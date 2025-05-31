import csv
import firebase_admin
from firebase_admin import credentials, firestore

# Firebase 서비스 계정 키 파일 경로
cred_path = r"C:\oninepawork\project\bangdeng\bangdeng-key.json"
# CSV 파일 경로
csv_path = r"C:\oninepawork\project\bangdeng\data\sample_data.csv"

# Firebase 앱 초기화 (이미 초기화된 경우 건너뛰기)
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()
collection_name = "locations" # 컬렉션 이름

print(f"'{csv_path}' 파일에서 데이터를 읽어 '{collection_name}' 컬렉션으로 업로드를 시작합니다.")

try:
    with open(csv_path, mode="r", encoding="utf-8-sig") as f: # utf-8-sig는 BOM이 있는 UTF-8 파일을 처리
        reader = csv.DictReader(f)
        
        # CSV 파일 헤더 출력 (디버깅용)
        print(f"CSV Headers: {reader.fieldnames}")

        count = 0
        for row in reader:
            try:
                # 위도(lat)와 경도(lng)를 float으로 변환
                # strip()을 사용하여 공백 제거 후 변환 시도
                lat_str = row.get('lat', '').strip()
                lng_str = row.get('lng', '').strip()

                if not lat_str or not lng_str:
                    print(f"경고: '{row.get('name', '이름 없음')}' 데이터에 위도 또는 경도 값이 비어 있습니다. 건너뜁니다.")
                    continue

                data = {
                    "name": row.get('name', '').strip(),
                    "address": row.get('address', '').strip(),
                    "lat": float(lat_str),
                    "lng": float(lng_str),
                    "type": row.get('type', '').strip().lower() # type도 소문자로 통일
                }
                db.collection(collection_name).add(data)
                count += 1
                print(f"업로드 완료 ({count}): {data['name']}")
            except ValueError as ve:
                print(f"오류: '{row.get('name', '이름 없음')}' 데이터 변환 중 오류 발생 (lat: '{lat_str}', lng: '{lng_str}'). 건너뜁니다. - {ve}")
            except Exception as e:
                print(f"오류: '{row.get('name', '이름 없음')}' 데이터 업로드 중 알 수 없는 오류 발생. 건너뜁니다. - {e}")
                print(f"오류 발생 데이터: {row}")

    print(f"\n※ 총 {count}개의 데이터 업로드 완료 ※")

except FileNotFoundError:
    print(f"오류: CSV 파일을 찾을 수 없습니다. 경로를 확인하세요: {csv_path}")
except Exception as e:
    print(f"스크립트 실행 중 오류 발생: {e}")