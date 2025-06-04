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
        name: 'Bangladesh', center: [23.6850, 90.3563], zoom: 7,
        languages: ['en', 'bn', 'ko'], localLang: 'bn', localName: 'বাংলাদেশ', flag: '🇧🇩'
    },
    'thailand': {
        name: 'Thailand', center: [15.8700, 100.9925], zoom: 6,
        languages: ['en', 'th', 'ko'], localLang: 'th', localName: 'ประเทศไทย', flag: '🇹🇭'
    },
    'vietnam': {
        name: 'Vietnam', center: [14.0583, 108.2772], zoom: 6,
        languages: ['en', 'vi', 'ko'], localLang: 'vi', localName: 'Việt Nam', flag: '🇻🇳'
    },
    'indonesia': {
        name: 'Indonesia', center: [-0.7893, 113.9213], zoom: 5,
        languages: ['en', 'id', 'ko'], localLang: 'id', localName: 'Indonesia', flag: '🇮🇩'
    },
    'philippines': {
        name: 'Philippines', center: [12.8797, 121.7740], zoom: 6,
        languages: ['en', 'tl', 'ko'], localLang: 'tl', localName: 'Pilipinas', flag: '🇵🇭'
    },
    'malaysia': {
        name: 'Malaysia', center: [4.2105, 101.9758], zoom: 6,
        languages: ['en', 'ms', 'ko'], localLang: 'ms', localName: 'Malaysia', flag: '🇲🇾'
    },
    'singapore': {
        name: 'Singapore', center: [1.3521, 103.8198], zoom: 11,
        languages: ['en', 'zh', 'ko'], localLang: 'zh', localName: '新加坡', flag: '🇸🇬'
    },
    'laos': {
        name: 'Laos', center: [19.8563, 102.4955], zoom: 6,
        languages: ['en', 'lo', 'ko'], localLang: 'lo', localName: 'ລາວ', flag: '🇱🇦'
    },
    'cambodia': {
        name: 'Cambodia', center: [12.5657, 104.9910], zoom: 7,
        languages: ['en', 'km', 'ko'], localLang: 'km', localName: 'កម្ពុជា', flag: '🇰🇭'
    },
    'myanmar': {
        name: 'Myanmar', center: [21.9162, 95.9560], zoom: 6,
        languages: ['en', 'my', 'ko'], localLang: 'my', localName: 'မြန်မာ', flag: '🇲🇲'
    },
    'india': {
        name: 'India', center: [20.5937, 78.9629], zoom: 5,
        languages: ['en', 'hi', 'ko'], localLang: 'hi', localName: 'भारत', flag: '🇮🇳'
    },
    'sri_lanka': {
        name: 'Sri Lanka', center: [7.8731, 80.7718], zoom: 7,
        languages: ['en', 'si', 'ko'], localLang: 'si', localName: 'ශ්‍රී ලංකා', flag: '🇱🇰'
    },
    'pakistan': {
        name: 'Pakistan', center: [30.3753, 69.3451], zoom: 5,
        languages: ['en', 'ur', 'ko'], localLang: 'ur', localName: 'پاکستان', flag: '🇵🇰'
    },
    'brazil': {
        name: 'Brazil', center: [-14.2350, -51.9253], zoom: 4,
        languages: ['en', 'pt', 'ko'], localLang: 'pt', localName: 'Brasil', flag: '🇧🇷'
    },
    'colombia': {
        name: 'Colombia', center: [4.5709, -74.2973], zoom: 5,
        languages: ['en', 'es', 'ko'], localLang: 'es', localName: 'Colombia', flag: '🇨🇴'
    },
    'venezuela': {
        name: 'Venezuela', center: [6.4238, -66.5897], zoom: 6,
        languages: ['en', 'es', 'ko'], localLang: 'es', localName: 'Venezuela', flag: '🇻🇪'
    },
    'peru': {
        name: 'Peru', center: [-9.1900, -75.0152], zoom: 5,
        languages: ['en', 'es', 'ko'], localLang: 'es', localName: 'Perú', flag: '🇵🇪'
    },
    'ecuador': {
        name: 'Ecuador', center: [-1.8312, -78.1834], zoom: 6,
        languages: ['en', 'es', 'ko'], localLang: 'es', localName: 'Ecuador', flag: '🇪🇨'
    },
    'mexico': {
        name: 'Mexico', center: [23.6345, -102.5528], zoom: 5,
        languages: ['en', 'es', 'ko'], localLang: 'es', localName: 'México', flag: '🇲🇽'
    },
    'argentina': {
        name: 'Argentina', center: [-38.4161, -63.6167], zoom: 4,
        languages: ['en', 'es', 'ko'], localLang: 'es', localName: 'Argentina', flag: '🇦🇷'
    },
    'nigeria': {
        name: 'Nigeria', center: [9.0820, 8.6753], zoom: 6,
        languages: ['en', 'ha', 'ko'], localLang: 'ha', localName: 'Najeriya', flag: '🇳🇬'
    },
    'kenya': {
        name: 'Kenya', center: [-0.0236, 37.9062], zoom: 6,
        languages: ['en', 'sw', 'ko'], localLang: 'sw', localName: 'Kenya', flag: '🇰🇪'
    },
    'tanzania': {
        name: 'Tanzania', center: [-6.3690, 34.8888], zoom: 6,
        languages: ['en', 'sw', 'ko'], localLang: 'sw', localName: 'Tanzania', flag: '🇹🇿'
    },
    'uganda': {
        name: 'Uganda', center: [1.3733, 32.2903], zoom: 7,
        languages: ['en', 'lg', 'ko'], localLang: 'lg', localName: 'Uganda', flag: '🇺🇬'
    },
    'australia': {
        name: 'Australia', center: [-25.2744, 133.7751], zoom: 4,
        languages: ['en', 'ko'], localLang: 'en', localName: 'Australia', flag: '🇦🇺'
    },
    'fiji': {
        name: 'Fiji', center: [-16.7784, 179.4144], zoom: 8,
        languages: ['en', 'fj', 'ko'], localLang: 'fj', localName: 'Viti', flag: '🇫🇯'
    },
    'papua_new_guinea': {
        name: 'Papua New Guinea', center: [-6.3149, 143.9555], zoom: 6,
        languages: ['en', 'tpi', 'ko'], localLang: 'tpi', localName: 'Papua Niugini', flag: '🇵🇬'
    }
};

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDJFAKgM4zz_tKQvkE3uS7km-9seW-UUS8",
  authDomain: "bangdeng-3039d.firebaseapp.com",
  projectId: "bangdeng-3039d",
  storageBucket: "bangdeng-3039d.firebasestorage.app",
  messagingSenderId: "272272781265",
  appId: "1:272272781265:web:0351741e2e7075e331faf0",
  measurementId: "G-49JFMCCKJ9"
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
    
    // 언어 선택 드롭다운의 현지어 옵션 업데이트
    updateLocalLanguageOption(country);
    
    // 해당 국가 데이터 로드
    loadCountryData(countryCode);
    
    console.log(`🌍 ${country.name}로 전환 완료`);
}

// 현지어 옵션 업데이트
function updateLocalLanguageOption(country) {
    const localOption = document.getElementById('localLangOption');
    if (localOption) {
        localOption.value = country.localLang;
        localOption.textContent = `${country.flag} ${country.localName}`;
    }
}

// 국가별 데이터 로드
function loadCountryData(countryCode) {
    document.getElementById('loading').style.display = 'block';
    
    // Firestore에서 해당 국가 데이터 로드
    db.collection(countryCode === 'bangladesh' ? 'bangladesh_locations' : `${countryCode}_locations`)
        .get()
        .then(snapshot => {
            allPlacesData = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.lat && data.lng) {
                    allPlacesData.push(data);
                }
            });
            
            console.log(allPlacesData);
            
            // 마커 표시
            filterPlaces('all');
            document.getElementById('loading').style.display = 'none';
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
                <b>${place.name || 'Medical Facility'}</b><br>
                ${place.address ? place.address + '<br>' : ''}
                <small>Type: ${place.type}</small><br>
                <small>Country: ${COUNTRIES[currentCountry].name}</small>
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

// 언어 변경 함수
async function changeLanguage(lang) {
    currentLang = lang;
    
    try {
        // 번역 파일 로드
        const response = await fetch(`app/locales/${lang}.json`);
        if (!response.ok) throw new Error('Translation file not found');
        
        const translations = await response.json();
        
        // UI 텍스트 업데이트
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
        
        // 필터 버튼 텍스트 업데이트
        updateFilterButtonTexts(translations);
        
        // 언어 선택 드롭다운 활성화
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = lang;
        }
        
        console.log(`🌐 언어 변경: ${lang}`);
        
    } catch (error) {
        console.error('언어 파일 로드 실패:', error);
    }
}

// 필터 버튼 텍스트 업데이트
function updateFilterButtonTexts(translations) {
    const filterButtons = {
        'all': translations.filter_all,
        'vaccine': translations.filter_vaccine,
        'blood_test': translations.filter_blood,
        'aid': translations.filter_aid,
        'dengue_center': translations.filter_center
    };
    
    Object.keys(filterButtons).forEach(filter => {
        const btn = document.querySelector(`[data-filter="${filter}"]`);
        if (btn && filterButtons[filter]) {
            const count = btn.textContent.match(/\((\d+)\)/);
            const countText = count ? ` (${count[1]})` : '';
            btn.textContent = filterButtons[filter] + countText;
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
    
    // 초기 언어 설정
    changeLanguage('en');
    
    // 국가 선택 이벤트
    document.getElementById('countrySelect').addEventListener('change', (e) => {
        switchCountry(e.target.value);
    });
    
    // 언어 선택 이벤트
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        const selectedLang = e.target.value;
        if (selectedLang === 'local') {
            const country = COUNTRIES[currentCountry];
            changeLanguage(country.localLang);
        } else {
            changeLanguage(selectedLang);
        }
    });
    
    // 필터 버튼 이벤트
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterPlaces(filter);
        });
    });
});
