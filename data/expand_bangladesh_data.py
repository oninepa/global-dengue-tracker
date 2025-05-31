# expand_bangladesh_data.py
import csv
import requests
import json

def get_more_hospitals():
    """OpenStreetMap에서 더 많은 병원 데이터 가져오기"""
    
    # 방글라데시 전체 지역 쿼리
    overpass_query = """
    [out:json][timeout:60];
    area["ISO3166-1"="BD"]->.searchArea;
    (
      node["amenity"="hospital"](area.searchArea);
      node["amenity"="clinic"](area.searchArea);
      node["amenity"="pharmacy"](area.searchArea);
      node["healthcare"](area.searchArea);
      way["amenity"="hospital"](area.searchArea);
      way["amenity"="clinic"](area.searchArea);
    );
    out center;
    """
    
    try:
        response = requests.post(
            'https://overpass-api.de/api/interpreter',
            data={'data': overpass_query},
            timeout=90
        )
        
        data = response.json()
        locations = []
        
        for element in data['elements']:
            if 'tags' in element:
                lat = element.get('lat') or element.get('center', {}).get('lat')
                lon = element.get('lon') or element.get('center', {}).get('lon')
                
                if lat and lon:
                    name = element['tags'].get('name', 'Medical Facility')
                    amenity = element['tags'].get('amenity', '')
                    healthcare = element['tags'].get('healthcare', '')
                    
                    # 타입 결정
                    if 'pharmacy' in amenity:
                        type_val = 'pharmacy'
                    elif 'vaccine' in name.lower() or 'vaccination' in name.lower():
                        type_val = 'vaccine'
                    elif 'blood' in name.lower() or 'diagnostic' in name.lower():
                        type_val = 'blood_test'
                    elif 'free' in name.lower() or 'charity' in name.lower():
                        type_val = 'aid'
                    else:
                        type_val = 'hospital'
                    
                    locations.append({
                        'name': name,
                        'address': element['tags'].get('addr:full', 'Bangladesh'),
                        'lat': round(lat, 6),
                        'lng': round(lon, 6),
                        'type': type_val
                    })
        
        return locations
        
    except Exception as e:
        print(f"오류: {e}")
        return []

# 실행
if __name__ == "__main__":
    print("🏥 방글라데시 전체 의료시설 데이터 수집 중...")
    hospitals = get_more_hospitals()
    
    with open('bangladesh_all_hospitals.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['name', 'address', 'lat', 'lng', 'type'])
        writer.writeheader()
        writer.writerows(hospitals)
    
    print(f"✅ {len(hospitals)}개 시설 데이터 수집 완료!")