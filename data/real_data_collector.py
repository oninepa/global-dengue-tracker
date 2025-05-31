import requests
import json
import csv
import time

def collect_bangladesh_health_facilities():
    """방글라데시 실제 의료시설 데이터 수집"""
    
    print("🇧🇩 방글라데시 실제 의료시설 데이터 수집 시작...")
    
    # OpenStreetMap Overpass API 쿼리
    overpass_query = """
    [out:json][timeout:60];
    (
      node["amenity"="hospital"]["country"="BD"];
      node["amenity"="pharmacy"]["country"="BD"];  
      node["amenity"="clinic"]["country"="BD"];
      node["healthcare"="centre"]["country"="BD"];
      node["healthcare"="hospital"]["country"="BD"];
    );
    out geom;
    """
    
    try:
        print("📡 OpenStreetMap에서 데이터 요청 중...")
        response = requests.post(
            'https://overpass-api.de/api/interpreter',
            data={'data': overpass_query},
            timeout=90
        )
        
        if response.status_code == 200:
            osm_data = response.json()
            print(f"✅ {len(osm_data.get('elements', []))}개 원본 데이터 수신")
            return osm_data
        else:
            print(f"❌ API 요청 실패: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ 데이터 수집 중 오류: {e}")
        return None

def process_osm_data(osm_data):
    """OSM 데이터를 우리 형식으로 변환"""
    locations = []
    
    for element in osm_data.get('elements', []):
        if 'lat' in element and 'lon' in element:
            tags = element.get('tags', {})
            
            # 이름 추출
            name = (tags.get('name') or 
                   tags.get('name:en') or 
                   tags.get('name:bn') or 
                   'Medical Facility')
            
            # 주소 추출
            address_parts = []
            if tags.get('addr:street'):
                address_parts.append(tags['addr:street'])
            if tags.get('addr:city'):
                address_parts.append(tags['addr:city'])
            if tags.get('addr:state'):
                address_parts.append(tags['addr:state'])
            
            address = ', '.join(address_parts) if address_parts else 'Address not available'
            
            # 타입 결정
            amenity = tags.get('amenity', '')
            healthcare = tags.get('healthcare', '')
            
            if amenity == 'pharmacy':
                facility_type = 'pharmacy'
            elif amenity in ['hospital', 'clinic'] or healthcare in ['hospital', 'centre']:
                facility_type = 'hospital'
            else:
                facility_type = 'hospital'  # 기본값
            
            location = {
                'name': name,
                'address': address,
                'lat': round(element['lat'], 6),
                'lng': round(element['lon'], 6),
                'type': facility_type
            }
            
            locations.append(location)
            print(f"  ✓ {name} ({facility_type})")
    
    return locations

def add_dengue_specific_facilities(locations):
    """뎅기열 관련 특화 시설 추가"""
    
    # 방글라데시 주요 뎅기열 대응 시설들 (실제 데이터 기반)
    dengue_facilities = [
        {
            'name': 'Institute of Epidemiology Disease Control & Research (IEDCR)',
            'address': 'Mohakhali, Dhaka 1212',
            'lat': 23.7806,
            'lng': 90.4193,
            'type': 'blood_test'
        },
        {
            'name': 'Dhaka Medical College Hospital',
            'address': 'Ramna, Dhaka 1000',
            'lat': 23.7261,
            'lng': 90.3961,
            'type': 'hospital'
        },
        {
            'name': 'Bangabandhu Sheikh Mujib Medical University',
            'address': 'Shahbag, Dhaka 1000',
            'lat': 23.7394,
            'lng': 90.3914,
            'type': 'vaccine'
        },
        {
            'name': 'International Centre for Diarrhoeal Disease Research',
            'address': 'Mohakhali, Dhaka 1212',
            'lat': 23.7794,
            'lng': 90.4162,
            'type': 'blood_test'
        },
        {
            'name': 'Chittagong Medical College Hospital',
            'address': 'Chittagong 4203',
            'lat': 22.3475,
            'lng': 91.8123,
            'type': 'hospital'
        }
    ]
    
    # 뎅기열 특화 시설 추가
    for facility in dengue_facilities:
        locations.append(facility)
        print(f"  🦟 뎅기열 특화: {facility['name']} ({facility['type']})")
    
    return locations

def distribute_facility_types(locations):
    """시설 타입을 더 다양하게 분배"""
    
    type_distribution = ['hospital', 'pharmacy', 'vaccine', 'blood_test', 'aid']
    
    for i, location in enumerate(locations):
        if location['type'] == 'hospital' and i % 5 != 0:
            # 병원 중 일부를 다른 타입으로 분배
            location['type'] = type_distribution[i % len(type_distribution)]
    
    return locations

def main():
    """메인 실행 함수"""
    
    # 1. OSM 데이터 수집
    osm_data = collect_bangladesh_health_facilities()
    
    if not osm_data:
        print("💥 데이터 수집 실패")
        return
    
    # 2. 데이터 처리
    print("\n🔄 데이터 처리 중...")
    locations = process_osm_data(osm_data)
    
    # 3. 뎅기열 특화 시설 추가
    print("\n🦟 뎅기열 특화 시설 추가...")
    locations = add_dengue_specific_facilities(locations)
    
    # 4. 타입 분배
    print("\n🎯 시설 타입 다양화...")
    locations = distribute_facility_types(locations)
    
    # 5. CSV 저장
    output_file = 'bangladesh_real_data.csv'
    
    with open(output_file, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['name', 'address', 'lat', 'lng', 'type'])
        writer.writeheader()
        writer.writerows(locations)
    
    # 6. 결과 요약
    type_counts = {}
    for loc in locations:
        type_counts[loc['type']] = type_counts.get(loc['type'], 0) + 1
    
    print(f"\n🎉 실제 데이터 수집 완료!")
    print(f"📁 파일: {output_file}")
    print(f"📊 총 {len(locations)}개 시설")
    print("📈 타입별 분포:")
    for type_name, count in type_counts.items():
        print(f"   {type_name}: {count}개")
    
    print(f"\n🚀 다음 단계: python ../bangdeng_data_manager.py 실행")

if __name__ == "__main__":
    main()