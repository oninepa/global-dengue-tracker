// 글로벌 뎅기열 추적 시스템

// 전역 변수
let allPlacesData = [];
let currentMarkers = [];
let markerClusterGroup;
let map;
let currentLang = 'en';
let currentCountry = 'bangladesh';
let translations = {};

// 국가 정보
const COUNTRIES = {
    'bangladesh': {
        name: 'Bangladesh',
        center: [23.6850, 90.3563],
        zoom: 7,
        languages: ['en', 'bn'],
        localLang: 'bn',
        localName: 'বাংলাদেশ',
        flag: '🇧🇩'
    },
    'nigeria': {
        name: 'Nigeria',
        center: [9.0820, 8.6753],
        zoom: 6,
        languages: ['en', 'ha'],
        localLang: 'ha',
        localName: 'Najeriya',
        flag: '🇳🇬'
    },
    'brazil': {
        name: 'Brazil',
        center: [-14.2350, -51.9253],
        zoom: 4,
        languages: ['pt', 'en'],
        localLang: 'pt',
        localName: 'Brasil',
        flag: '🇧🇷'
    },
    'thailand': {
        name: 'Thailand',
        center: [15.8700, 100.9925],
        zoom: 6,
        languages: ['th', 'en'],
        localLang: 'th',
        localName: 'ประเทศไทย',
        flag: '🇹🇭'
    },
    'indonesia': {
        name: 'Indonesia',
        center: [-0.7893, 113.9213],
        zoom: 5,
        languages: ['id', 'en'],
        localLang: 'id',
        localName: 'Indonesia',
        flag: '🇮🇩'
    }
    // 나머지 국가들도 추가...
};

// Firebase 설정
const firebaseConfig = {
    // 여기에 Firebase 설정 넣기
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 지도 초기화
function initializeMap() {
    map = L.map('map').setView(COUNTRIES[currentCountry].center, COUNTRIES[currentCountry].zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // 마커 클러스터 그룹 생성
    markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true
    });
    map.addLayer(markerClusterGroup);
    
    console.log("🗺️ 글로벌 지도 초기화 완료");
}

// 국가 변경
function switchCountry(countryCode) {
    currentCountry = countryCode;
    const country = COUNTRIES[countryCode];
    
    if (!country) return;
    
    // 지도 중심 이동
    map.setView(country.center, country.zoom);
    
    // 국가명 업데이트
    document.getElementById('currentCountryName').textContent = country.name;
    
    // 현지 언어 버튼 업데이트
    const localBtn = document.getElementById('localLangBtn');
    localBtn.textContent = country.localName.substring(0, 3);
    localBtn.setAttribute('data-lang', country.localLang);
    
    // 해당 국가 데이터 로드
    loadCountryData(countryCode);
    
    console.log(`🌍 ${country.name}로 전환 완료`);
}

// 국가별 데이터 로드
function loadCountryData(countryCode) {
    document.getElementById('loading').style.display = 'block';
    
    // Firestore에서 해당 국가 데이터 로드
    db.collection('global_locations')
        .where('country', '==', countryCode)
        .get()
        .then(snapshot => {
            allPlacesData = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.lat && data.lng) {
                    allPlacesData.push(data);
                }
            });
            
            console.log(`📊 ${countryCode}: ${allPlacesData.length}개 시설 로드`);
            
            // 마커 표시
            filterPlaces('all');
            
            // 로딩 숨기기
            document.getElementById('loading').style.display = 'none';
            
            // 필터 버튼 개수 업데이트
            updateFilterCounts();
        })
        .catch(error => {
            console.error('데이터 로드 오류:', error);
            document.getElementById('loading').style.display = 'none';
        });
}

// 커스텀 아이콘 생성
function getCustomIcon(type) {
    const iconConfigs = {
        'vaccine': { html: '💉', color: '#2ecc71' },
        'blood_test': { html: '🩸', color: '#9b59b6' },
        'aid': { html: '⛑️', color: '#f39c12' },
        'dengue_center': { html: '🏥', color: '#e74c3c' }
    };
    
    const config = iconConfigs[type] || iconConfigs['dengue_center'];
    
    return L.divIcon({
        html: config.html,
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
}

// 필터링
function filterPlaces(type) {
    markerClusterGroup.clearLayers();
    
    const filteredData = type === 'all' ? 
        allPlacesData : 
        allPlacesData.filter(place => place.type === type);
    
    filteredData.forEach(place => {
        const icon = getCustomIcon(place.type);
        const marker = L.marker([place.lat, place.lng], {icon: icon})
            .bindPopup(`
                <b>${place.name}</b><br>
                ${place.address}<br>
                <small>${place.type}</small>
            `);
        markerClusterGroup.addLayer(marker);
    });
    
    // 필터 버튼 활성화
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${type}"]`).classList.add('active');
    
    console.log(`🔍 ${type} 필터: ${filteredData.length}개 표시`);
}

// 필터 개수 업데이트
function updateFilterCounts() {
    const counts = {
        'all': allPlacesData.length,
        'vaccine': allPlacesData.filter(p => p.type === 'vaccine').length,
        'blood_test': allPlacesData.filter(p => p.type === 'blood_test').length,
        'aid': allPlacesData.filter(p => p.type === 'aid').length,
        'dengue_center': allPlacesData.filter(p => p.type === 'dengue_center').length
    };
    
    Object.keys(counts).forEach(type => {
        const btn = document.querySelector(`[data-filter="${type}"]`);
        if (btn) {
            const text = btn.textContent.split('(')[0].trim();
            btn.textContent = `${text} (${counts[type]})`;
        }
    });
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    console.log("🌍 Global Dengue Tracker 시작");
    
    // 지도 초기화
    initializeMap();
    
    // 초기 국가 데이터 로드
    loadCountryData(currentCountry);
    
    // 국가 선택 이벤트
    document.getElementById('countrySelect').addEventListener('change', (e) => {
        switchCountry(e.target.value);
    });
    
    // 필터 버튼 이벤트
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterPlaces(filter);
        });
    });
    
    // 언어 버튼 이벤트
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            changeLanguage(lang);
        });
    });
});

// 언어 변경 (기본 구조)
function changeLanguage(lang) {
    currentLang = lang;
    
    // 언어 버튼 활성화
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-lang="${lang}"]`).classList.add('active');
    
    console.log(`🌐 언어 변경: ${lang}`);
}