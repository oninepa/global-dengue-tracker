// Firebase Firestore 인스턴스 가져오기
const db = firebase.firestore();

// 필터링 기능을 위한 전역 변수
let allPlacesData = []; // 모든 장소 데이터를 저장할 배열
let currentMarkers = []; // 현재 지도에 표시된 마커들을 저장할 배열

console.log("Firestore 인스턴스 준비 완료!");

// *** 여기에 다른 PWA 코드가 이어집니다. ***
// 예: 언어 설정, 이벤트 리스너 등

// Service Worker 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js') // manifest.json과 같은 위치라면 /app/service-worker.js 또는 상대경로
            .then(registration => {
                console.log('Service Worker 등록 성공:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker 등록 실패:', error);
            });
    });
}

// 다국어 지원 초기화
let currentLang = 'en'; // 기본 언어를 영어로 설정
let translations = {}; // 번역 데이터를 저장할 객체

// 사용자 브라우저 언어 감지
function detectUserLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    if (userLang.startsWith('bn')) {
        return 'bn'; // 벵골어
    } else if (userLang.startsWith('ko')) {
        return 'ko'; // 한국어
    }
    return 'en'; // 기본값은 영어
}

// 번역 데이터 로드
async function loadTranslations(lang) {
    try {
        // manifest.json이 app 폴더에 있으므로, locales도 app 폴더 기준으로 경로 설정 고려
        // 현재는 루트 기준: `locales/${lang}.json`
        // 만약 locales 폴더가 app 폴더 안에 있다면: `app/locales/${lang}.json` 또는 상대경로
        const response = await fetch(`locales/${lang}.json`); // 경로 확인 필요
        if (!response.ok) {
            console.warn(`Translation file for ${lang} not found, status: ${response.status}`);
            throw new Error('Translation file not found');
        }
        translations[lang] = await response.json();
        console.log(`${lang} translation data loaded.`);
        return translations[lang];
    } catch (error) {
        console.error(`Failed to load translations for ${lang}:`, error);
        // 영어를 대체 언어로 사용
        if (lang !== 'en' && !translations['en']) { // 무한 루프 방지
            console.log('Falling back to English translations...');
            return loadTranslations('en');
        }
        return {}; // 빈 객체 반환 또는 기본 번역 제공
    }
}

// 실제 번역 적용 함수 (예시 - 실제 UI 요소 업데이트 필요)
function applyTranslations() {
    const langData = translations[currentLang];
    if (!langData) {
        console.warn(`No translation data found for ${currentLang}. UI might not be translated.`);
        return;
    }
    // 예시: document.querySelector('h1').textContent = langData.title;
    // 필요한 UI 요소들의 텍스트를 여기서 변경합니다.
    // 필터 버튼 텍스트도 여기서 변경할 수 있습니다. (예: langData.filter_hospital 등)
    console.log(`UI elements should be updated for ${currentLang} (implement actual updates).`);
}


// 언어 변경 적용
async function changeLanguage(lang) {
    currentLang = lang;
    if (!translations[lang]) {
        await loadTranslations(lang);
    }
    applyTranslations(); // 번역 적용 함수 호출
    console.log(`언어가 ${lang}로 변경되었습니다.`);
    localStorage.setItem('preferredLanguage', lang);
}

// 지도 초기화 (Leaflet) - DOM 로드와 관계없이 먼저 선언될 수 있음
const map = L.map('map').setView([23.6850, 90.3563], 10); // 방글라데시 중심 좌표
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
console.log("Map initialized.");

// 필터링된 장소를 지도에 표시하는 함수
function loadAndDisplayPlaces(filterType = "all") {
    // 1. 기존 마커들 제거
    currentMarkers.forEach(marker => marker.remove());
    currentMarkers = []; // 마커 배열 비우기

    // 2. 표시할 데이터 필터링
    let placesToDisplay;
    if (filterType === "all") {
        placesToDisplay = allPlacesData;
    } else {
        placesToDisplay = allPlacesData.filter(place => place.type === filterType);
    }

    console.log(`필터: ${filterType}, 표시할 장소: ${placesToDisplay.length}개`);

    // 3. 필터링된 데이터로 마커 생성
    let validLocationsCount = 0;
    placesToDisplay.forEach(place => {
        if (place && typeof place.lat === 'number' && typeof place.lng === 'number' && !isNaN(place.lat) && !isNaN(place.lng)) {
            try {
                const marker = L.marker([place.lat, place.lng])
                                .addTo(map)
                                .bindPopup(`<b>${place.name || '이름 없음'}</b><br>${place.address || '주소 정보 없음'}<br>타입: ${place.type || '정보 없음'}`);
                currentMarkers.push(marker);
                validLocationsCount++;
            } catch (e) {
                console.error(`마커 생성 중 오류 (${place.name}):`, e);
            }
        } else {
            console.error(
                `[ID: ${place.id || '알수없음'}] 마커 생성 불가 - 위치 정보 문제:`,
                `이름: ${place.name || '정보 없음'},`,
                `lat: ${place.lat} (타입: ${typeof place.lat}),`,
                `lng: ${place.lng} (타입: ${typeof place.lng})`
            );
        }
    });
    console.log(`총 ${placesToDisplay.length}개 중 ${validLocationsCount}개의 마커 생성 완료.`);
}


// DOM이 로드된 후 실행될 코드들
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed.");

    // 저장된 언어 설정 또는 브라우저 언어 감지하여 초기 언어 설정
    const savedLang = localStorage.getItem('preferredLanguage') || detectUserLanguage();
    changeLanguage(savedLang); // 비동기 함수이므로, 완료를 기다리지 않고 다음 코드 실행될 수 있음

    // 언어 선택 버튼에 이벤트 리스너 추가
    const langButtons = document.querySelectorAll('.language-selector button');
    if (langButtons.length > 0) {
        langButtons.forEach(button => {
            button.addEventListener('click', () => {
                const lang = button.getAttribute('data-lang');
                changeLanguage(lang);
            });
        });
    } else {
        console.warn("Language selector buttons not found.");
    }

    // 필터 버튼에 이벤트 리스너 추가
    const filterButtons = document.querySelectorAll('.filter-container button');
    if (filterButtons.length > 0) {
        // 초기에 '모두 보기' 버튼을 활성화 (만약 HTML에 'active' 클래스가 없다면)
        const activeButton = document.querySelector('.filter-container button.active');
        if (!activeButton && filterButtons[0]) { // 첫번째 버튼을 기본 활성으로
             filterButtons[0].classList.add('active');
        }

        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // 현재 활성화된 버튼 비활성화
                const currentActive = document.querySelector('.filter-container button.active');
                if(currentActive) {
                    currentActive.classList.remove('active');
                }
                // 클릭한 버튼 활성화
                e.target.classList.add('active');

                const filterType = e.target.dataset.filter;
                console.log(`${filterType} 필터가 선택되었습니다.`);
                loadAndDisplayPlaces(filterType); // 필터링 함수 호출
            });
        });
    } else {
        console.warn("Filter buttons not found.");
    }

    // Firestore 데이터 로드 및 초기 마커 표시
    // (DOMContentLoaded 내에서 호출하여 모든 DOM 요소가 준비된 후 데이터 로드 시작)
    firebase.firestore().collection("locations").get()
      .then(snapshot => {
        console.log("Firestore에서 전체 데이터 가져오기 성공! 문서 개수:", snapshot.size);

        allPlacesData = []; // 기존 데이터 초기화
        if (snapshot.empty) {
            console.log("Firestore 'locations' 컬렉션에 데이터가 없습니다.");
        } else {
            snapshot.forEach(doc => {
                const placeData = doc.data();
                placeData.id = doc.id; // 문서 ID 저장
                allPlacesData.push(placeData);
            });
        }
        // '모두 보기' 필터 버튼이 초기에 활성화되어 있으므로, 해당 타입으로 로드
        const initialFilterType = document.querySelector('.filter-container button.active')?.dataset.filter || "all";
        loadAndDisplayPlaces(initialFilterType);

      })
      .catch(error => {
        console.error("Firestore에서 데이터 불러오기 실패:", error);
        allPlacesData = [];
        loadAndDisplayPlaces("all"); // 오류 발생 시 빈 지도를 보여주거나, 사용자에게 알림
      });

}); // DOMContentLoaded 끝

console.log("app.js execution finished."); // 스크립트 파일 실행 완료 로그