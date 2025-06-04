import requests
import json
import csv

class OSMDengueCollector:
    def __init__(self):
        self.overpass_url = "http://overpass-api.de/api/interpreter"
        self.countries = {
            'bangladesh': {
                'name': 'Bangladesh',
                'bbox': [88.0, 20.0, 92.1, 26.6],
                'country_code': 'BD'
            },
            'thailand': {
                'name': 'Thailand',
                'bbox': [97.3, 5.6, 105.6, 20.5],
                'country_code': 'TH'
            },
            'vietnam': {
                'name': 'Vietnam',
                'bbox': [102.14, 8.18, 109.46, 23.39],
                'country_code': 'VN'
            },
            'indonesia': {
                'name': 'Indonesia',
                'bbox': [95.0, -11.0, 141.0, 6.0],
                'country_code': 'ID'
            },
            'philippines': {
                'name': 'Philippines',
                'bbox': [116.0, 4.0, 126.0, 21.0],
                'country_code': 'PH'
            },
            'malaysia': {
                'name': 'Malaysia',
                'bbox': [100.0, 0.5, 120.0, 7.5],
                'country_code': 'MY'
            },
            'singapore': {
                'name': 'Singapore',
                'bbox': [103.6, 1.2, 104.1, 1.5],
                'country_code': 'SG'
            },
            'laos': {
                'name': 'Laos',
                'bbox': [100.1, 13.9, 107.7, 22.5],
                'country_code': 'LA'
            },
            'cambodia': {
                'name': 'Cambodia',
                'bbox': [102.3, 10.4, 107.6, 14.7],
                'country_code': 'KH'
            },
            'myanmar': {
                'name': 'Myanmar',
                'bbox': [92.2, 9.5, 101.2, 28.5],
                'country_code': 'MM'
            },
            'india': {
                'name': 'India',
                'bbox': [68.7, 6.7, 97.25, 35.5],
                'country_code': 'IN'
            },
            'sri_lanka': {
                'name': 'Sri Lanka',
                'bbox': [79.6, 5.9, 81.9, 9.8],
                'country_code': 'LK'
            },
            'pakistan': {
                'name': 'Pakistan',
                'bbox': [60.9, 23.6, 77.0, 37.0],
                'country_code': 'PK'
            },
            'brazil': {
                'name': 'Brazil',
                'bbox': [-74.0, -33.0, -34.0, 5.3],
                'country_code': 'BR'
            },
            'colombia': {
                'name': 'Colombia',
                'bbox': [-79.0, -4.2, -66.9, 13.4],
                'country_code': 'CO'
            },
            'venezuela': {
                'name': 'Venezuela',
                'bbox': [-73.4, 0.6, -59.8, 12.2],
                'country_code': 'VE'
            },
            'peru': {
                'name': 'Peru',
                'bbox': [-84.0, -18.3, -68.6, 0.2],
                'country_code': 'PE'
            },
            'ecuador': {
                'name': 'Ecuador',
                'bbox': [-92.0, -5.0, -75.2, 2.3],
                'country_code': 'EC'
            },
            'mexico': {
                'name': 'Mexico',
                'bbox': [-118.5, 14.5, -86.7, 32.7],
                'country_code': 'MX'
            },
            'argentina': {
                'name': 'Argentina',
                'bbox': [-73.6, -55.1, -53.6, -21.8],
                'country_code': 'AR'
            },
            'nigeria': {
                'name': 'Nigeria',
                'bbox': [2.7, 4.3, 14.7, 13.9],
                'country_code': 'NG'
            },
            'kenya': {
                'name': 'Kenya',
                'bbox': [33.8, -4.7, 41.9, 5.0],
                'country_code': 'KE'
            },
            'tanzania': {
                'name': 'Tanzania',
                'bbox': [29.3, -11.7, 40.4, 0.9],
                'country_code': 'TZ'
            },
            'uganda': {
                'name': 'Uganda',
                'bbox': [29.6, -1.5, 35.0, 4.2],
                'country_code': 'UG'
            },
            'australia': {
                'name': 'Australia',
                'bbox': [113.3, -43.7, 153.6, -10.7],
                'country_code': 'AU'
            },
            'fiji': {
                'name': 'Fiji',
                'bbox': [177.9, -19.5, -178.4, -16.0],
                'country_code': 'FJ'
            },
            'papua_new_guinea': {
                'name': 'Papua New Guinea',
                'bbox': [140.8, -11.6, 156.0, -1.0],
                'country_code': 'PG'
            }
        }
    
    def build_overpass_query(self, bbox, country_code):
        query = f"""
        [out:json][timeout:60];
        (
          node["amenity"="clinic"]({bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]});
          node["amenity"="hospital"]({bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]});
        );
        out center meta;
        """
        return query
    
    def process_facility(self, element, country_code):
        try:
            # 좌표 추출
            if element['type'] == 'node':
                lat = element['lat']
                lng = element['lon']
            else:
                return None
            
            tags = element.get('tags', {})
            name = tags.get('name', 'Unknown Facility')
            
            # 뎅기열 관련 시설 판별
            facility_type = self.determine_facility_type(tags)
            if not facility_type:
                return None
            
            return {
                'name': name,
                'lat': lat,
                'lng': lng,
                'type': facility_type,
                'country': country_code
            }
        except:
            return None
    
    def determine_facility_type(self, tags):
        name = tags.get('name', '').lower()
        description = tags.get('description', '').lower()
        healthcare = tags.get('healthcare', '').lower()
    
         # 뎅기열 관련 키워드만 허용
        dengue_keywords = [
           'dengue', 'aedes', 'mosquito', 'fever clinic',
           'vaccination center', 'immunization', 
           'blood test', 'diagnostic lab', 'rapid test',
           'free medicine', 'free clinic dengue', 'prevention center'
        ]
    
        text_to_check = f"{name} {description} {healthcare}"
    
        for keyword in dengue_keywords:
            if keyword in text_to_check:
                if 'vaccin' in keyword or 'immuniz' in keyword:
                    return 'vaccine'
                elif 'blood' in keyword or 'test' in keyword or 'lab' in keyword:
                    return 'blood_test'
                elif 'free' in keyword or 'medicine' in keyword:
                    return 'aid'
                else:
                    return 'dengue_center'
    
        return None  # 뎅기열 관련 없으면 제외
    
    def save_to_csv(self, facilities, country_code):
        filename = f"data/{country_code}_facilities.csv"
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['name', 'lat', 'lng', 'type', 'country']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for facility in facilities:
                writer.writerow(facility)
        
        print(f"💾 {filename}에 {len(facilities)}개 시설 저장 완료")
    
    def collect_country_data(self, country_code):
        print(f"🚀 {country_code} 데이터 수집 시작")
        
        country_info = self.countries[country_code]
        bbox = country_info['bbox']
        
        query = self.build_overpass_query(bbox, country_code)
        
        try:
            response = requests.post(
                self.overpass_url,
                data=query,
                timeout=120
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {len(data['elements'])}개 시설 발견")
                
                # 뎅기열 관련 시설 필터링
                filtered_facilities = []
                for element in data['elements']:
                    facility = self.process_facility(element, country_code)
                    if facility:
                        filtered_facilities.append(facility)
                
                print(f"🔍 뎅기열 관련 시설: {len(filtered_facilities)}개")
                
                for facility in filtered_facilities[:5]:  # 처음 5개만 출력
                    print(f"  - {facility['name']} ({facility['type']})")
                
                # CSV 파일로 저장
                self.save_to_csv(filtered_facilities, country_code)
                    
            else:
                print(f"❌ 오류: {response.status_code}")
                
        except Exception as e:
            print(f"❌ 데이터 수집 실패: {e}")

if __name__ == "__main__":
    collector = OSMDengueCollector()
    collector.collect_country_data('papua_new_guinea')