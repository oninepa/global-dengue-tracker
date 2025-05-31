"""
전 세계 뎅기열 대응 시설 글로벌 시스템
Phase 1: 핵심 10개국
"""

class GlobalDengueSystem:
    def __init__(self):
        # 뎅기열 고위험 핵심 10개국
        self.countries = {
            'bangladesh': {
                'name': 'Bangladesh',
                'center': [23.6850, 90.3563],
                'zoom': 7,
                'language': ['en', 'bn'],
                'currency': 'BDT'
            },
            'nigeria': {
                'name': 'Nigeria', 
                'center': [9.0820, 8.6753],
                'zoom': 6,
                'language': ['en', 'ha'],
                'currency': 'NGN'
            },
            'brazil': {
                'name': 'Brazil',
                'center': [-14.2350, -51.9253], 
                'zoom': 4,
                'language': ['pt', 'en'],
                'currency': 'BRL'
            },
            'thailand': {
                'name': 'Thailand',
                'center': [15.8700, 100.9925],
                'zoom': 6,
                'language': ['th', 'en'],
                'currency': 'THB'
            },
            'indonesia': {
                'name': 'Indonesia',
                'center': [-0.7893, 113.9213],
                'zoom': 5,
                'language': ['id', 'en'],
                'currency': 'IDR'
            },
            'philippines': {
                'name': 'Philippines',
                'center': [12.8797, 121.7740],
                'zoom': 6,
                'language': ['tl', 'en'],
                'currency': 'PHP'
            },
            'india': {
                'name': 'India',
                'center': [20.5937, 78.9629],
                'zoom': 5,
                'language': ['hi', 'en'],
                'currency': 'INR'
            },
            'vietnam': {
                'name': 'Vietnam',
                'center': [14.0583, 108.2772],
                'zoom': 6,
                'language': ['vi', 'en'],
                'currency': 'VND'
            },
            'malaysia': {
                'name': 'Malaysia',
                'center': [4.2105, 101.9758],
                'zoom': 6,
                'language': ['ms', 'en'],
                'currency': 'MYR'
            },
            'sri_lanka': {
                'name': 'Sri Lanka',
                'center': [7.8731, 80.7718],
                'zoom': 7,
                'language': ['si', 'en'],
                'currency': 'LKR'
            }
        }
        
        # 뎅기열 전용 시설 타입
        self.facility_types = {
            'vaccine': 'Dengue Vaccination Center',
            'blood_test': 'Dengue Diagnostic Lab', 
            'aid': 'Free Dengue Clinic',
            'dengue_center': 'Dengue Control Center'
        }
    
    def get_country_data(self, country_code):
        """특정 국가 정보 반환"""
        return self.countries.get(country_code)
    
    def get_all_countries(self):
        """모든 국가 목록 반환"""
        return list(self.countries.keys())

# 국가별 데이터 수집기
def collect_country_dengue_data(country_code):
    """특정 국가의 뎅기열 시설 데이터 수집"""
    
    system = GlobalDengueSystem()
    country_info = system.get_country_data(country_code)
    
    if not country_info:
        print(f"❌ {country_code} 국가 정보 없음")
        return []
    
    print(f"🌍 {country_info['name']} 뎅기열 시설 데이터 수집 중...")
    
    # OpenStreetMap 쿼리 (국가별)
    overpass_query = f"""
    [out:json][timeout:60];
    area["ISO3166-1"~"^{country_code.upper()}$"]->.country;
    (
      node["amenity"~"hospital|clinic|pharmacy"]["name"~"dengue|fever|diagnostic"](area.country);
      node["healthcare"](area.country);
    );
    out geom;
    """
    
    # 실제 수집 로직은 내일 Firestore와 함께
    print(f"✅ {country_info['name']} 쿼리 준비 완료")
    return []

if __name__ == "__main__":
    system = GlobalDengueSystem()
    
    print("🌍 Global Dengue System - Phase 1")
    print("핵심 10개국 뎅기열 대응 시설 시스템")
    print("=" * 50)
    
    for code, info in system.countries.items():
        print(f"🏳️ {info['name']} ({code.upper()})")
        print(f"   중심좌표: {info['center']}")
        print(f"   언어: {', '.join(info['language'])}")
        print()
    
    print("🚀 내일 Firestore와 함께 실제 데이터 수집 시작!")