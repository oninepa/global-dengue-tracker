import csv
import random

def create_dengue_specific_data():
    """뎅기열 전용 시설 데이터 생성"""
    
    # 방글라데시 주요 도시
    cities = {
        'Dhaka': {'lat': 23.8103, 'lng': 90.4125},
        'Chittagong': {'lat': 22.3569, 'lng': 91.7832},
        'Sylhet': {'lat': 24.8949, 'lng': 91.8687},
        'Rajshahi': {'lat': 24.3745, 'lng': 88.6042},
        'Khulna': {'lat': 22.8456, 'lng': 89.5403}
    }
    
    # 뎅기열 전용 시설 템플릿
    facilities = {
        'vaccine': [
            '{city} Dengue Vaccination Center',
            '{city} EPI Dengue Center',
            'Dengue Prevention Center {city}',
            '{city} Immunization Clinic'
        ],
        'blood_test': [
            '{city} Dengue Diagnostic Lab',
            'Dengue Blood Test Center {city}',
            '{city} Fever Diagnostic Center',
            'Dengue Detection Lab {city}'
        ],
        'aid': [
            '{city} Free Dengue Clinic',
            'Dengue Relief Center {city}',
            '{city} Community Dengue Care',
            'Free Dengue Treatment {city}'
        ],
        'dengue_center': [
            '{city} Dengue Control Center',
            'Dengue Surveillance Unit {city}',
            '{city} Dengue Response Team',
            'Dengue Emergency Center {city}'
        ]
    }
    
    locations = []
    
    for city, coords in cities.items():
        for facility_type, templates in facilities.items():
            # 각 타입별로 3-4개씩 생성
            count = random.randint(3, 4)
            
            for i in range(count):
                template = random.choice(templates)
                name = template.replace('{city}', city)
                
                # 도시 중심에서 약간씩 떨어뜨리기
                lat_offset = random.uniform(-0.03, 0.03)
                lng_offset = random.uniform(-0.03, 0.03)
                
                location = {
                    'name': name,
                    'address': f"{city}, Bangladesh",
                    'lat': round(coords['lat'] + lat_offset, 6),
                    'lng': round(coords['lng'] + lng_offset, 6),
                    'type': facility_type
                }
                
                locations.append(location)
                print(f"✓ {name}")
    
    return locations

# 실행
if __name__ == "__main__":
    print("🦟 뎅기열 전용 시설 데이터 생성 중...")
    dengue_data = create_dengue_specific_data()
    
    with open('dengue_only_data.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['name', 'address', 'lat', 'lng', 'type'])
        writer.writeheader()
        writer.writerows(dengue_data)
    
    print(f"✅ {len(dengue_data)}개 뎅기열 전용 시설 생성 완료!")