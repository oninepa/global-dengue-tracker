# 로컬 Python 스크립트로 Firestore에 데이터 업로드

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os
import pandas as pd # JSON 파일을 pandas로 읽을 때 사용

# --- 설정 ---
# 로컬에 다운로드한 서비스 계정 키 파일 경로
# 이 스크립트 파일과의 상대 경로 또는 절대 경로를 사용하세요.
SERVICE_ACCOUNT_KEY_FILE = '../bangdeng-3039d-firebase-adminsdk-fbsvc-6a56547393.json' # <-- **키 파일 경로 수정!** (예: ../bangdeng-info-....json)

# 로컬에 다운로드한 최종 JSON 데이터 파일 경로
# 이 스크립트 파일과의 상대 경로 또는 절대 경로를 사용하세요.
PROCESSED_JSON_FILE = '../../data/processed/processed_locations_20250526_181555.json' # <-- **JSON 파일 경로 수정!**

# Firebase Firestore 컬렉션 이름
COLLECTION_NAME = 'locations'
# --- 설정 끝 ---


# Firebase 앱 초기화
print(f"서비스 계정 키 '{SERVICE_ACCOUNT_KEY_FILE}'로 Firebase 앱 초기화 중...")
try:
    # credentials.Certificate는 파일 경로를 받습니다.
    cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_FILE)
    # 초기화 시 프로젝트 ID를 명시적으로 지정하는 것이 좋습니다.
    # 프로젝트 ID는 서비스 계정 키 파일 내용에 포함되어 있습니다.
    # 또는 Firebase CLI에서 firebase use 명령으로 설정된 프로젝트를 사용합니다.
    # project_id = cred.get_project_id() # 키 파일에서 프로젝트 ID 가져오기 시도
    # firebase_admin.initialize_app(cred, {'projectId': project_id})

    # 또는 Firebase CLI에서 설정된 프로젝트를 사용하려면 project_id 생략
    firebase_admin.initialize_app(cred)

    print("Firebase 앱 초기화 완료")
except FileNotFoundError:
    print(f"오류: 서비스 계정 키 파일 '{SERVICE_ACCOUNT_KEY_FILE}'을(를) 찾을 수 없습니다.")
    print("SERVICE_ACCOUNT_KEY_FILE 경로가 올바른지 확인해주세요.")
    exit()
except Exception as e:
    print(f"Firebase 앱 초기화 중 오류 발생: {e}")
    exit()


# Firestore 클라이언트 가져오기
db = firestore.client()
print("Firestore 클라이언트 준비 완료")

# JSON 파일 읽어오기
print(f"'{PROCESSED_JSON_FILE}' 파일 읽어오는 중...")
data = None
try:
    # pandas를 사용하여 JSON 파일 읽기 (더 안정적일 수 있습니다)
    # orient='records'는 JSON이 레코드(객체) 목록 형태임을 나타냅니다.
    df = pd.read_json(PROCESSED_JSON_FILE, orient='records')
    data = df.to_dict(orient='records') # 다시 리스트 오브 딕셔너리 형태로 변환
    print(f"파일 읽어오기 완료. {len(data)}개의 레코드 확인.")
except FileNotFoundError:
    print(f" 오류: JSON 데이터 파일 '{PROCESSED_JSON_FILE}'을(를) 찾을 수 없습니다.")
    print("PROCESSED_JSON_FILE 경로가 올바른지 확인해주세요.")
except Exception as e:
    print(f"JSON 파일 읽어오기 중 오류 발생: {e}")


# Firestore에 데이터 업로드
if data: # data 리스트가 비어있지 않다면
    print(f"'{COLLECTION_NAME}' 컬렉션에 데이터 업로드 중...")
    batch = db.batch() # 대량 쓰기를 위한 Batch 객체 생성
    upload_count = 0

    # 각 레코드를 Firestore 문서로 추가
    for item in data:
        # Firestore 문서 ID는 자동 생성되도록 add() 함수 사용
        # 또는 특정 필드(예: name)를 문서 ID로 사용하려면 .document(item['name']).set(item) 사용
        # 샘플 데이터의 service_type은 리스트 형태입니다. Firestore는 리스트를 지원합니다.

        doc_ref = db.collection(COLLECTION_NAME).document() # 자동 ID 생성
        batch.set(doc_ref, item) # batch에 쓰기 작업 추가
        upload_count += 1

        # Batch는 최대 500개의 쓰기 작업을 처리할 수 있습니다.
        # 500개마다 커밋하여 전송합니다.
        if upload_count % 500 == 0:
            print(f"Batch 커밋 중... (현재까지 {upload_count}개)")
            try:
                batch.commit()
                batch = db.batch() # 새 batch 시작
            except Exception as e:
                print(f"Batch 커밋 중 오류 발생: {e}")
                # 오류 발생 시 추가 작업 중단 또는 로깅 필요
                # break # 예: 오류 시 중단
                batch = db.batch() # 새 batch 시작 (오류난 batch는 버림)


    # 마지막 남은 작업 커밋
    if upload_count % 500 != 0 or (upload_count > 0 and upload_count % 500 == 0): # 마지막 batch가 비어있지 않거나, 딱 500의 배수로 끝난 경우 마지막 batch 커밋
         if batch._write_count > 0: # 실제로 batch에 쓰기 작업이 남아있는지 확인
            print(f"마지막 Batch 커밋 중... (총 {upload_count}개)")
            try:
                batch.commit()
            except Exception as e:
                print(f"마지막 Batch 커밋 중 오류 발생: {e}")

    print("데이터 업로드 완료!")
    print(f"총 {upload_count}개의 문서가 '{COLLECTION_NAME}' 컬렉션에 추가되었습니다.")

else:
    print("업로드할 데이터가 없습니다.") 