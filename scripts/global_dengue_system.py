class GlobalDengueSystem:
    def __init__(self):
        self.countries = {
            'bangladesh': {'center': [23.6850, 90.3563], 'zoom': 7},
            'nigeria': {'center': [9.0820, 8.6753], 'zoom': 6},
            'brazil': {'center': [-14.2350, -51.9253], 'zoom': 4},
            'thailand': {'center': [15.8700, 100.9925], 'zoom': 6}
        }
        
        self.diseases = ['dengue', 'malaria', 'zika', 'chikungunya']
    
    def get_country_data(self, country, disease='dengue'):
        """특정 국가의 특정 질병 데이터 반환"""
        # 실제 구현에서는 각 국가별 데이터베이스 조회
        pass
    
    def switch_country_view(self, country):
        """지도 중심을 해당 국가로 이동"""
        return self.countries.get(country, self.countries['bangladesh'])