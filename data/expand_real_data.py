# expand_real_data.py
"""
실제 데이터를 기반으로 더 많은 현실적인 데이터 생성
"""

import csv
import random

def expand_bangladesh_data():
    """방글라데시 주요 도시별 의료시설 데이터 확장"""
    
    # 방글라데시 주요 도시 좌표
    major_cities = {
        'Dhaka': {'lat': 23.8103, 'lng': 90.4125, 'population': 9000000},
        'Chittagong': {'lat': 22.3569, 'lng': 91.7832, 'population': 2500000},
        'Sylhet': {'lat': 24.8949, 'lng': 91.8687, 'population': 500000},
        'Rajshahi': {'lat': 24.3745, 'lng': 88.6042, 'population': 450000},
        'Khulna': {'lat': 22.8456, 'lng': 89.5403, 'population': 660000},
        'Barisal': {'lat': 22.7010, 'lng': 90.3535, 'population': 330000},
        'Rangpur': {'lat': 25.7439, 'lng': 89.2752, 'population': 300000},
        'Comilla': {'lat': 23.4607, 'lng': 91.1809, 'population': 390000},
        'Mymensingh': {'lat': 24.7471, 'lng': 90.4203, 'population': 260000},
        'Cox\'s Bazar': {'lat': 21.4272, 'lng': 92.0058, 'population': 220000}
    }
    
    # 시설 이름 템플릿
    facility_templates = {
        'hospital': [
            '{city} General Hospital',
            '{city} Medical College Hospital', 
            '{city} District Hospital',
            '{city} Sadar Hospital',
            '{city} Community Hospital',
            'Shaheed {city} Hospital',
            '{city} Central Hospital',
            '{city} Specialized Hospital'
        ],
        'pharmacy': [
            '{city} Pharmacy',
            'Popular Pharmacy {city}',
            'Square Pharmacy {city}',
            'Lazz Pharma {city}',
            '{city} Drug House',
            'City Pharmacy {city}',
            'New {city} Pharmacy',
            'Modern Pharmacy {city}'
        ],
        'vaccine': [
            '{city} Vaccination Centre',
            '{city} EPI Centre',
            '{city} Immunization Centre',
            '{city} Health Centre',
            '{city} Primary Health Care'
        ],
        'blood_test': [
            '{city} Diagnostic Centre',
            '{city} Pathology Lab',
            'Popular Diagnostic {city}',
            'Ibn Sina Diagnostic {city}',
            '{city} Medical Lab'
        ],
        'aid': [
            '{city} Free Clinic',
            '{city} Charity Hospital',
            'NGO Health Centre {city}',
            '{city} Community Clinic',
            'Free Medical Camp {city}'
        ]
    }
    
    all_facilities = []
    
    for city, info in major_cities.items():
        # 인구에 비례한 시설 개수 계산
        base_facilities = max(5, int(info['population'] / 200000))
        
        print(f"🏙️ {city} - {base_facilities}개 시설 생성")
        
        for facility_type, templates in facility_templates.items():
            # 타입별 시설 개수
            type_count = max(1, base_facilities // 5)
            if facility_type == 'hospital':
                type_count = max(2, base_facilities // 3)  # 병원은 더 많이
            
            for i in range(type_count):
                # 랜덤 위치 생성 (도시 중심에서 반경 내)
                lat_offset = random.uniform(-0.05, 0.05)
                lng_offset = random.uniform(-0.05, 0.05)
                
                # 시설명 생성
                template = random.choice(templates)
                if '{city}' in template:
                    name = template.replace('{city}', city)
                else:
                    name = f"{template} - {city}"
                
                # 주소 생성
                areas = ['Sadar', 'Central', 'North', 'South', 'East', 'West']
                area = random.choice(areas)
                address = f"{area} {city}, Bangladesh"
                
                facility = {
                    'name': name,
                    'address': address,
                    'lat': round(info['lat'] + lat_offset, 6),
                    'lng': round(info['lng'] + lng_offset, 6),
                    'type': facility_type
                }
                
                all_facilities.append(facility)
                print(f"  ✓ {name}")
    
    return all_facilities

def main():
    """메인 실행"""
    print("🇧🇩 방글라데시 현실적인 의료시설 데이터 확장 생성")
    
    # 기존 실제 데이터 읽기
    existing_data = []
    try:
        with open('bangladesh_real_data.csv', 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            existing_data = list(reader)
        print(f"📄 기존 데이터: {len(existing_data)}개")
    except FileNotFoundError:
        print("📄 기존 데이터 없음, 새로 생성")
    
    # 확장 데이터 생성
    expanded_data = expand_bangladesh_data()
    
    # 합치기
    all_data = existing_data + expanded_data
    
    # 중복 제거 (이름 기준)
    seen_names = set()
    unique_data = []
    for item in all_data:
        if item['name'] not in seen_names:
            unique_data.append(item)
            seen_names.add(item['name'])
    
    # 저장
    output_file = 'bangladesh_expanded_data.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['name', 'address', 'lat', 'lng', 'type'])
        writer.writeheader()
        writer.writerows(unique_data)
    
    # 결과 요약
    type_counts = {}
    for item in unique_data:
        type_counts[item['type']] = type_counts.get(item['type'], 0) + 1
    
    print(f"\n🎉 확장 데이터 생성 완료!")
    print(f"📁 파일: {output_file}")
    print(f"📊 총 {len(unique_data)}개 시설")
    print("📈 타입별 분포:")
    for type_name, count in type_counts.items():
        print(f"   {type_name}: {count}개")

if __name__ == "__main__":
    main()