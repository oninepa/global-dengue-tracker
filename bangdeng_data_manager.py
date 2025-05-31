import csv
import json
import os
from typing import List, Dict, Any
import firebase_admin
from firebase_admin import credentials, firestore
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO

class BangdengDataManager:
    """Bangdeng 프로젝트 데이터 관리 클래스"""
    
    def __init__(self, firebase_key_path: str = "bangdeng-key.json"):
        """
        초기화 함수
        
        Args:
            firebase_key_path: Firebase 서비스 계정 키 파일 경로
        """
        self.firebase_key_path = firebase_key_path
        self.db = None
        self.location_types = {
            'hospital': '병원',
            'pharmacy': '약국', 
            'vaccine': '백신 접종소',
            'blood_test': '피 검사소',
            'aid': '무료 치료소'
        }
        self._init_firebase()
    
    def _init_firebase(self) -> None:
        """Firebase 초기화"""
        try:
            if not firebase_admin._apps:
                cred = credentials.Certificate(self.firebase_key_path)
                firebase_admin.initialize_app(cred)
            self.db = firestore.client()
            print("✅ Firebase 초기화 완료")
        except Exception as e:
            print(f"❌ Firebase 초기화 실패: {e}")
            raise
    
    def update_csv_with_proper_types(self, csv_path: str = "sample_data.csv") -> None:
        """
        CSV 파일의 type 필드를 정의된 5가지 유형으로 업데이트
        
        Args:
            csv_path: 업데이트할 CSV 파일 경로
            
        Time Complexity: O(n)
        Space Complexity: O(n)
        """
        try:
            # 기존 CSV 읽기
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                rows = list(reader)
            
            # type 필드 업데이트
            type_keys = list(self.location_types.keys())
            for i, row in enumerate(rows):
                # 기존 type이 정의된 유형이 아니면 순환적으로 할당
                if row.get('type') not in type_keys:
                    row['type'] = type_keys[i % len(type_keys)]
            
            # 업데이트된 CSV 저장
            backup_path = csv_path.replace('.csv', '_backup.csv')
            os.rename(csv_path, backup_path)
            
            with open(csv_path, 'w', newline='', encoding='utf-8') as file:
                if rows:
                    writer = csv.DictWriter(file, fieldnames=rows[0].keys())
                    writer.writeheader()
                    writer.writerows(rows)
            
            print(f"✅ CSV 파일 업데이트 완료: {csv_path}")
            print(f"📁 백업 파일 생성: {backup_path}")
            
        except Exception as e:
            print(f"❌ CSV 업데이트 실패: {e}")
            raise
    
    def upload_csv_to_firestore(self, csv_path: str = "sample_data.csv", 
                               collection_name: str = "locations") -> None:
        """
        업데이트된 CSV 데이터를 Firestore에 업로드
        
        Args:
            csv_path: CSV 파일 경로
            collection_name: Firestore 컬렉션 이름
        """
        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                batch = self.db.batch()
                count = 0
                
                for row in reader:
                    # 데이터 타입 변환
                    data = {
                        'name': row['name'],
                        'address': row['address'],
                        'lat': float(row['lat']),
                        'lng': float(row['lng']),
                        'type': row['type']
                    }
                    
                    # 문서 참조 생성 (자동 ID)
                    doc_ref = self.db.collection(collection_name).document()
                    batch.set(doc_ref, data)
                    count += 1
                    
                    # 배치 크기 제한 (Firestore는 500개까지)
                    if count % 500 == 0:
                        batch.commit()
                        batch = self.db.batch()
                        print(f"📤 {count}개 문서 업로드 완료")
                
                # 남은 데이터 커밋
                if count % 500 != 0:
                    batch.commit()
                
                print(f"✅ 총 {count}개 문서 Firestore 업로드 완료")
                
        except Exception as e:
            print(f"❌ Firestore 업로드 실패: {e}")
            raise
    
    def generate_pwa_icons(self, base_text: str = "BD", output_dir: str = "icons") -> None:
        """
        PWA용 아이콘 파일들을 자동 생성
        
        Args:
            base_text: 아이콘에 표시할 텍스트
            output_dir: 아이콘 파일 저장 디렉토리
        """
        # 필요한 아이콘 크기들
        icon_sizes = [72, 96, 128, 144, 152, 192, 384, 512]
        
        # 출력 디렉토리 생성
        os.makedirs(output_dir, exist_ok=True)
        
        try:
            for size in icon_sizes:
                # 새 이미지 생성 (정사각형, 파란색 배경)
                img = Image.new('RGB', (size, size), color='#2196F3')
                draw = ImageDraw.Draw(img)
                
                # 텍스트 크기 계산
                font_size = size // 3
                try:
                    # 시스템 폰트 사용 시도
                    font = ImageFont.truetype("arial.ttf", font_size)
                except:
                    # 기본 폰트 사용
                    font = ImageFont.load_default()
                
                # 텍스트 중앙 정렬
                bbox = draw.textbbox((0, 0), base_text, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                
                x = (size - text_width) // 2
                y = (size - text_height) // 2
                
                # 텍스트 그리기 (흰색)
                draw.text((x, y), base_text, fill='white', font=font)
                
                # 파일 저장
                filename = f"icon-{size}x{size}.png"
                filepath = os.path.join(output_dir, filename)
                img.save(filepath, 'PNG')
                
                print(f"✅ 아이콘 생성: {filepath}")
            
            # manifest.json 업데이트
            self._update_manifest_icons(output_dir, icon_sizes)
            
        except Exception as e:
            print(f"❌ 아이콘 생성 실패: {e}")
            raise
    
    def _update_manifest_icons(self, icon_dir: str, sizes: List[int]) -> None:
        """manifest.json의 아이콘 경로 업데이트"""
        manifest_path = "manifest.json"
        
        try:
            # 기존 manifest.json 읽기
            if os.path.exists(manifest_path):
                with open(manifest_path, 'r', encoding='utf-8') as file:
                    manifest = json.load(file)
            else:
                # 기본 manifest 생성
                manifest = {
                    "name": "Bangdeng - 댕기열 시설 찾기",
                    "short_name": "Bangdeng",
                    "description": "방글라데시 댕기열 관련 시설 위치 정보",
                    "start_url": "/",
                    "display": "standalone",
                    "background_color": "#ffffff",
                    "theme_color": "#2196F3"
                }
            
            # 아이콘 배열 생성
            icons = []
            for size in sizes:
                icons.append({
                    "src": f"{icon_dir}/icon-{size}x{size}.png",
                    "sizes": f"{size}x{size}",
                    "type": "image/png"
                })
            
            manifest["icons"] = icons
            
            # manifest.json 저장
            with open(manifest_path, 'w', encoding='utf-8') as file:
                json.dump(manifest, file, indent=2, ensure_ascii=False)
            
            print(f"✅ manifest.json 업데이트 완료")
            
        except Exception as e:
            print(f"❌ manifest.json 업데이트 실패: {e}")
            raise
    
    def validate_firestore_data(self, collection_name: str = "locations") -> Dict[str, Any]:
        """
        Firestore 데이터 검증 및 통계 정보 반환
        
        Args:
            collection_name: 검증할 컬렉션 이름
            
        Returns:
            검증 결과 및 통계 정보
        """
        try:
            docs = self.db.collection(collection_name).stream()
            
            stats = {
                'total_count': 0,
                'type_distribution': {},
                'invalid_coordinates': [],
                'missing_fields': [],
                'valid_types': set(self.location_types.keys())
            }
            
            for doc in docs:
                data = doc.to_dict()
                stats['total_count'] += 1
                
                # 필수 필드 검증
                required_fields = ['name', 'address', 'lat', 'lng', 'type']
                missing = [field for field in required_fields if field not in data]
                if missing:
                    stats['missing_fields'].append({
                        'doc_id': doc.id,
                        'missing': missing
                    })
                
                # 좌표 유효성 검증
                try:
                    lat, lng = float(data.get('lat', 0)), float(data.get('lng', 0))
                    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                        stats['invalid_coordinates'].append({
                            'doc_id': doc.id,
                            'lat': lat,
                            'lng': lng
                        })
                except (ValueError, TypeError):
                    stats['invalid_coordinates'].append({
                        'doc_id': doc.id,
                        'lat': data.get('lat'),
                        'lng': data.get('lng')
                    })
                
                # 타입 분포 계산
                location_type = data.get('type', 'unknown')
                stats['type_distribution'][location_type] = \
                    stats['type_distribution'].get(location_type, 0) + 1
            
            # 결과 출력
            print("📊 Firestore 데이터 검증 결과:")
            print(f"  총 문서 수: {stats['total_count']}")
            print(f"  타입별 분포: {stats['type_distribution']}")
            print(f"  잘못된 좌표: {len(stats['invalid_coordinates'])}개")
            print(f"  필드 누락: {len(stats['missing_fields'])}개")
            
            return stats
            
        except Exception as e:
            print(f"❌ 데이터 검증 실패: {e}")
            raise
    
    def cleanup_duplicate_data(self, collection_name: str = "locations") -> None:
        """
        Firestore에서 중복 데이터 정리
        
        Args:
            collection_name: 정리할 컬렉션 이름
        """
        try:
            docs = self.db.collection(collection_name).stream()
            seen_locations = set()
            duplicates = []
            
            for doc in docs:
                data = doc.to_dict()
                # 이름과 주소 조합으로 중복 판단
                location_key = f"{data.get('name', '')}_{data.get('address', '')}"
                
                if location_key in seen_locations:
                    duplicates.append(doc.id)
                else:
                    seen_locations.add(location_key)
            
            # 중복 문서 삭제
            if duplicates:
                batch = self.db.batch()
                for doc_id in duplicates:
                    doc_ref = self.db.collection(collection_name).document(doc_id)
                    batch.delete(doc_ref)
                
                batch.commit()
                print(f"✅ {len(duplicates)}개 중복 문서 삭제 완료")
            else:
                print("✅ 중복 데이터 없음")
                
        except Exception as e:
            print(f"❌ 중복 데이터 정리 실패: {e}")
            raise

def main():
    """메인 실행 함수"""
    print("🚀 Bangdeng PWA 데이터 관리 시작")
    
    try:
        manager = BangdengDataManager()
        
        # 1. CSV 타입 필드 업데이트
        print("\n1️⃣ CSV 파일 타입 필드 업데이트")
        manager.update_csv_with_proper_types("data/dengue_only_data.csv")
        
        # 2. PWA 아이콘 생성
        print("\n2️⃣ PWA 아이콘 생성")
        manager.generate_pwa_icons(output_dir="img")
        
        # 3. 기존 Firestore 데이터 정리
        print("\n3️⃣ Firestore 중복 데이터 정리")
        manager.cleanup_duplicate_data()
        
        # 4. 업데이트된 데이터 업로드
        print("\n4️⃣ 업데이트된 데이터 Firestore 업로드")
        manager.upload_csv_to_firestore("data/dengue_only_data.csv")
        
        # 5. 데이터 검증
        print("\n5️⃣ 데이터 검증")
        manager.validate_firestore_data()
        
        print("\n🎉 모든 작업 완료!")
        
    except Exception as e:
        print(f"\n💥 작업 실패: {e}")

if __name__ == "__main__":
    main()