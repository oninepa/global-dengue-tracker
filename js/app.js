// Firebase Firestore 인스턴스 가져오기
const db = firebase.firestore();

console.log("Firestore 인스턴스 준비 완료!");

// 전역 변수
let allPlacesData = [];
let currentMarkers = [];
let map;
let currentLang = 'en';
let translations = {};

// 전역 변수에 추가
let markerClusterGroup;

// initializeMap 함수에 추가
function initializeMap() {
    map = L.map('map').setView([23.6850, 90.3563], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // 마커 클러스터 그룹 생성
    markerClusterGroup = L.markerClusterGroup();
    map.addLayer(markerClusterGroup);
}

// addMarkersToMap 함수 수정
function addMarkersToMap(places) {
    markerClusterGroup.clearLayers();
    
    places.forEach(place => {
        if (place && typeof place.lat === 'number' && typeof place.lng === 'number') {
            try {
                const customIcon = getCustomIcon(place.type);
                const marker = L.marker([place.lat, place.lng], {icon: customIcon})
                    .bindPopup(`<b>${place.name}</b><br>${place.address}<br><small>${getTypeLabel(place.type)}</small>`);
                markerClusterGroup.addLayer(marker);
            } catch (e) {
                console.error(`마커 생성 중 오류:`, e);
            }
        }
    });
}
// Service Worker 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker 등록 성공:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker 등록 실패:', error);
            });
    });
}

// 사용자 브라우저 언어 감지
function detectUserLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    if (userLang.startsWith('bn')) {
        return 'bn'; // 벵골어
    }
    return 'en'; // 기본값은 영어
}

// 번역 데이터 로드
async function loadTranslations(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
            throw new Error('Translation file not found');
        }
        translations[lang] = await response.json();
        return translations[lang];
    } catch (error) {
        console.error('Failed to load translations:', error);
        if (lang !== 'en') {
            return loadTranslations('en');
        }
        return {};
    }
}

// 언어 변경 적용
async function changeLanguage(lang) {
    currentLang = lang;
    if (!translations[lang]) {
        await loadTranslations(lang);
    }

    // 실제 번역 적용
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // 필터 버튼 번역
    const filterTranslations = {
        'en': {
            'all': 'All',
            'hospital': 'Hospital',
            'pharmacy': 'Pharmacy',
            'vaccine': 'Vaccine Center',
            'blood_test': 'Blood Test',
            'aid': 'Free Clinic'
        },
        'bn': {
            'all': 'সব',
            'hospital': 'হাসপাতাল',
            'pharmacy': 'ফার্মেসি',
            'vaccine': 'টিকা কেন্দ্র',
            'blood_test': 'রক্ত পরীক্ষা',
            'aid': 'বিনামূল্যে চিকিৎসা'
        }
    };
    
    // 필터 버튼 텍스트 업데이트
    document.querySelectorAll('.filter-container button').forEach(button => {
        const filter = button.getAttribute('data-filter');
        const count = button.textContent.match(/\((\d+)\)/);
        const translation = filterTranslations[lang]?.[filter] || filter;
        button.textContent = count ? `${translation} (${count[1]})` : translation;
    });

    localStorage.setItem('preferredLanguage', lang);
}

// 타입별 커스텀 아이콘 정의
function getCustomIcon(type) {
    const iconConfigs = {
        'hospital': {
            html: '🏥',
            className: 'custom-marker hospital-marker'
        },
        'pharmacy': {
            html: '💊', 
            className: 'custom-marker pharmacy-marker'
        },
        'vaccine': {
            html: '💉',
            className: 'custom-marker vaccine-marker'
        },
        'blood_test': {
            html: '🩸',
            className: 'custom-marker blood-marker'
        },
        'aid': {
            html: '⛑️',
            className: 'custom-marker aid-marker'
        }
    };
    
    const config = iconConfigs[type] || iconConfigs['hospital'];
    
    return L.divIcon({
        html: config.html,
        className: config.className,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
}

// 마커 제거 함수
function clearMarkers() {
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];
}

// 마커 생성 및 추가 함수
function addMarkersToMap(places) {
    clearMarkers();
    
    places.forEach(place => {
        if (place && typeof place.lat === 'number' && typeof place.lng === 'number' && 
            !isNaN(place.lat) && !isNaN(place.lng)) {
            try {
                const customIcon = getCustomIcon(place.type);
                const marker = L.marker([place.lat, place.lng], {icon: customIcon})
                    .bindPopup(`<b>${place.name || '이름 없음'}</b><br>${place.address || '주소 정보 없음'}<br><small>유형: ${getTypeLabel(place.type)}</small>`);
                marker.addTo(map);
                currentMarkers.push(marker);
            } catch (e) {
                console.error(`마커 생성 중 오류 발생 (${place.name}):`, e);
            }
        }
    });
    
    console.log(`${places.length}개 장소의 마커가 표시되었습니다.`);
}

// 장소 유형 라벨 반환
function getTypeLabel(type) {
    const typeLabels = {
        'hospital': '병원',
        'pharmacy': '약국',
        'vaccine': '백신 접종소',
        'blood_test': '피 검사소',
        'aid': '무료 치료소'
    };
    return typeLabels[type] || type;
}

// 필터링 함수
function filterPlaces(type) {
    console.log(`필터 적용: ${type}`);
    
    let filteredData;
    if (type === 'all') {
        filteredData = allPlacesData;
    } else {
        filteredData = allPlacesData.filter(place => place.type === type);
    }
    
    addMarkersToMap(filteredData);
    
    // 필터 버튼 활성화 상태 업데이트
    document.querySelectorAll('.filter-container button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${type}"]`).classList.add('active');
    
    console.log(`${type} 필터: ${filteredData.length}개 표시`);
}

// 지도 초기화
function initializeMap() {
    map = L.map('map').setView([23.6850, 90.3563], 10); // 방글라데시 중심 좌표
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    console.log("지도 초기화 완료");
}

// Firestore 데이터 로드
function loadPlacesData() {
    console.log("Firestore 데이터 로드 시작...");
    
    firebase.firestore().collection("locations").get()
        .then(snapshot => {
            console.log("Firestore 데이터 요청 성공! 가져온 문서 개수:", snapshot.size);

            if (snapshot.empty) {
                console.log("Firestore 'locations' 컬렉션에 데이터가 없습니다.");
                return;
            }

            allPlacesData = [];
            let validLocationsCount = 0;

            snapshot.forEach(doc => {
                const place = doc.data();
                console.log(`처리 중인 데이터: ${place.name}, lat: ${place.lat} (타입: ${typeof place.lat}), lng: ${place.lng} (타입: ${typeof place.lng}), type: ${place.type}`);

                // 데이터 유효성 검사
                if (place && typeof place.lat === 'number' && typeof place.lng === 'number' && 
                    !isNaN(place.lat) && !isNaN(place.lng)) {
                    allPlacesData.push(place);
                    validLocationsCount++;
                } else {
                    console.error(
                        `[${doc.id}] 유효하지 않은 데이터:`,
                        `이름: ${place.name || '정보 없음'},`,
                        `lat 값: ${place.lat} (타입: ${typeof place.lat}),`,
                        `lng 값: ${place.lng} (타입: ${typeof place.lng})`
                    );
                }
            });

            console.log(`총 ${snapshot.size}개 데이터 중 ${validLocationsCount}개의 유효한 데이터를 로드했습니다.`);
            
            // 초기에는 모든 데이터 표시
            filterPlaces('all');
            
            // 타입별 개수 표시
            updateFilterButtonCounts();
            
        })
        .catch(error => {
            console.error("Firestore에서 데이터를 가져오는 중 오류 발생:", error);
        });
}

// 필터 버튼에 개수 표시 업데이트
function updateFilterButtonCounts() {
    const typeCounts = {
        'all': allPlacesData.length,
        'hospital': allPlacesData.filter(p => p.type === 'hospital').length,
        'pharmacy': allPlacesData.filter(p => p.type === 'pharmacy').length,
        'vaccine': allPlacesData.filter(p => p.type === 'vaccine').length,
        'blood_test': allPlacesData.filter(p => p.type === 'blood_test').length,
        'aid': allPlacesData.filter(p => p.type === 'aid').length
    };
    
    Object.keys(typeCounts).forEach(type => {
        const button = document.querySelector(`[data-filter="${type}"]`);
        if (button) {
            const originalText = button.textContent.split('(')[0].trim();
            button.textContent = `${originalText} (${typeCounts[type]})`;
        }
    });
    
    console.log('타입별 개수:', typeCounts);
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM 로드 완료, 앱 초기화 시작");
    
    // 지도 초기화
    initializeMap();
    
    // 데이터 로드
    loadPlacesData();
    
    // 저장된 언어 설정 또는 브라우저 언어 감지
    const savedLang = localStorage.getItem('preferredLanguage') || detectUserLanguage();
    changeLanguage(savedLang);

    // 언어 선택 버튼 이벤트 리스너
    const langButtons = document.querySelectorAll('.language-selector button');
    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.getAttribute('data-lang');
            changeLanguage(lang);
        });
    });

    // 필터 버튼 이벤트 리스너
    const filterButtons = document.querySelectorAll('.filter-container button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            filterPlaces(filter);
        });
    });
    
    console.log("모든 이벤트 리스너 설정 완료");
});