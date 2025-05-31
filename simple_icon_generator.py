import os
import requests
from io import BytesIO

def download_placeholder_icons(output_dir: str = "icons") -> None:
    """
    온라인에서 플레이스홀더 아이콘 다운로드
    
    Args:
        output_dir: 아이콘 저장 디렉토리
    """
    os.makedirs(output_dir, exist_ok=True)
    
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    base_url = "https://via.placeholder.com"
    
    for size in sizes:
        try:
            # 플레이스홀더 이미지 URL
            url = f"{base_url}/{size}x{size}/2196F3/ffffff?text=BD"
            
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            filename = f"icon-{size}x{size}.png"
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, 'wb') as file:
                file.write(response.content)
            
            print(f"✅ 아이콘 다운로드: {filepath}")
            
        except Exception as e:
            print(f"❌ {size}x{size} 아이콘 다운로드 실패: {e}")

# quick_type_updater.py (타입 필드만 빠르게 업데이트)
"""
CSV 파일의 type 필드만 빠르게 업데이트하는 스크립트
"""

def quick_update_types(csv_path: str = "sample_data.csv") -> None:
    """
    CSV 파일의 type 필드를 빠르게 업데이트
    
    Args:
        csv_path: 업데이트할 CSV 파일 경로
    """
    import csv
    import os
    
    types = ['hospital', 'pharmacy', 'vaccine', 'blood_test', 'aid']
    
    try:
        # 임시 파일 생성
        temp_path = csv_path + '.tmp'
        
        with open(csv_path, 'r', encoding='utf-8') as infile, \
             open(temp_path, 'w', newline='', encoding='utf-8') as outfile:
            
            reader = csv.DictReader(infile)
            writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames)
            writer.writeheader()
            
            for i, row in enumerate(reader):
                row['type'] = types[i % len(types)]
                writer.writerow(row)
        
        # 원본 파일 교체
        os.replace(temp_path, csv_path)
        print(f"✅ {csv_path} 타입 필드 업데이트 완료")
        
    except Exception as e:
        print(f"❌ 타입 업데이트 실패: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    print("간단한 아이콘 생성 및 타입 업데이트")
    download_placeholder_icons()
    quick_update_types()