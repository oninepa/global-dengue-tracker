// Firebase 초기화
firebase.initializeApp({
  apiKey: "AIzaSyDJFAKgM4zz_tKQvkE3uS7km-9seW-UUS8",
  authDomain: "bangdeng-3039d.firebaseapp.com",
  projectId: "bangdeng-3039d",
  storageBucket: "bangdeng-3039d.firebasestorage.app",
  messagingSenderId: "272272781265",
  appId: "1:272272781265:web:0351741e2e7075e331faf0",
  measurementId: "G-49JFMCCKJ9"
});

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
    return 'en';
}

async function loadTranslations(lang) {
    // 임시로 하드코딩된 번역
    const hardcodedTranslations = {
        "report_title": "Share Dengue-Related Location",
        "email": "Email", 
        "country": "Country",
        "facility_type": "Facility Type",
        "description": "Description",
        "description_placeholder": "Please describe the location, address, and services...",
        "attachment": "Attachment",
        "submit_report": "Submit Report",
        "select_country": "Select Country"
    };
    
    translations[lang] = hardcodedTranslations;
    console.log("Loaded translations:", translations[lang]);
    return translations[lang];
}

async function changeLanguage(lang) {
    currentLang = lang;
    if (!translations[lang]) {
        await loadTranslations(lang);
    }

    // 기존 data-translate 처리
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // 특별 처리가 필요한 요소들
    const reportTextarea = document.getElementById('reportText');
    if (reportTextarea && translations[lang] && translations[lang].description_placeholder) {
        reportTextarea.placeholder = translations[lang].description_placeholder;
    }

    const countrySelect = document.getElementById('reportCountry');
    if (countrySelect && translations[lang] && translations[lang].select_country) {
        const firstOption = countrySelect.querySelector('option[value=""]');
        if (firstOption) {
            firstOption.textContent = translations[lang].select_country;
        }
    }

    // 필터 버튼 번역
    document.querySelectorAll('.filter-container button').forEach(button => {
        const filter = button.getAttribute('data-filter');
        const count = button.textContent.match(/\((\d+)\)/);
        
        let translation = filter;
        if (translations[lang] && translations[lang][`filter_${filter}`]) {
            translation = translations[lang][`filter_${filter}`];
        }
        
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
        },
        'dengue_center': {
            html: '🏥',
            className: 'custom-marker hospital-marker'
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

// 지도 초기화
function initializeMap() {
    map = L.map('map').setView([23.6850, 90.3563], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // 마커 클러스터 그룹 생성
    markerClusterGroup = L.markerClusterGroup();
    map.addLayer(markerClusterGroup);
    
    console.log("지도 초기화 완료");
}

// 마커 생성 및 추가 함수
function addMarkersToMap(places) {
    markerClusterGroup.clearLayers();
    
    places.forEach(place => {
        if (place && typeof place.lat === 'number' && typeof place.lng === 'number') {
            try {
                const customIcon = getCustomIcon(place.type);
                const marker = L.marker([place.lat, place.lng], {icon: customIcon})
                    .bindPopup(`<b>${place.name}</b><br>${place.address || ''}<br><small>${getTypeLabel(place.type)}</small>`);
                markerClusterGroup.addLayer(marker);
            } catch (e) {
                console.error(`마커 생성 중 오류:`, e);
            }
        }
    });
    
    console.log(`${places.length}개 장소의 마커가 표시되었습니다.`);
}

// 장소 유형 라벨 반환
function getTypeLabel(type) {
    if (translations[currentLang] && translations[currentLang][`type_${type}`]) {
        return translations[currentLang][`type_${type}`];
    }
    
    // 기본 영어 라벨
    const typeLabels = {
        'hospital': 'Hospital',
        'pharmacy': 'Pharmacy',
        'vaccine': 'Vaccination Center',
        'blood_test': 'Blood Test Center',
        'aid': 'Free Clinic',
        'dengue_center': 'Dengue Center'
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
        'aid': allPlacesData.filter(p => p.type === 'aid').length,
        'dengue_center': allPlacesData.filter(p => p.type === 'dengue_center').length
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

// 제보 시스템 JavaScript
async function handleReportSubmit(e) {
    e.preventDefault();
    
    // 폼 데이터 수집
    const formData = {
        email: document.getElementById('reportEmail').value,
        country: document.getElementById('reportCountry').value,
        type: document.getElementById('reportType').value,
        description: document.getElementById('reportText').value,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // 파일 첨부 처리
    const fileInput = document.getElementById('reportFile');
    if (fileInput.files[0]) {
        formData.hasAttachment = true;
        formData.fileName = fileInput.files[0].name;
        formData.fileSize = fileInput.files[0].size;
    }
    
    try {
        // 로딩 상태 표시
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '📤 Sending...';
        submitBtn.disabled = true;
        
        // Firestore에 제보 데이터 저장
        await db.collection('user_reports').add(formData);
        
        // 성공 메시지
        alert('✅ Report submitted successfully! Thank you for your contribution.');
        
        // 폼 초기화
        document.getElementById('reportForm').reset();
        
        // 버튼 복원
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Error submitting report:', error);
        alert('❌ Error submitting report. Please try again.');
        
        // 버튼 복원
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.textContent = '📤 Submit Report';
        submitBtn.disabled = false;
    }
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

    // 언어 선택 드롭다운 이벤트 리스너
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            const lang = e.target.value;
            changeLanguage(lang);
        });
    }

    // 필터 버튼 이벤트 리스너
    const filterButtons = document.querySelectorAll('.filter-container button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            filterPlaces(filter);
        });
    });
    
    // 제보 폼 이벤트 리스너
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', handleReportSubmit);
    }
    
    console.log("모든 이벤트 리스너 설정 완료");
});
// Firebase Auth 초기화
const auth = firebase.auth();

// Auth 상태 변경 감지
auth.onAuthStateChanged((user) => {
    const authButton = document.getElementById('authButton');
    const authButtonText = document.getElementById('authButtonText');
    
    if (user) {
        authButtonText.textContent = user.displayName || user.email;
        authButton.onclick = () => showUserProfile(user);
    } else {
        authButtonText.textContent = 'Login';
        authButton.onclick = () => showAuthModal();
    }
});

// 인증 모달 표시
function showAuthModal() {
    document.getElementById('authModal').style.display = 'block';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('userProfile').style.display = 'none';
}

// 사용자 프로필 표시
function showUserProfile(user) {
    document.getElementById('authModal').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('userProfile').style.display = 'block';
    
    document.getElementById('userName').textContent = user.displayName || 'User';
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userPhoto').src = user.photoURL || 'https://via.placeholder.com/60';
}

// 구글 로그인
document.getElementById('googleLogin').addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        document.getElementById('authModal').style.display = 'none';
    } catch (error) {
        alert('Google login failed: ' + error.message);
    }
});

// 이메일 회원가입
document.getElementById('emailSignup').addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        document.getElementById('authModal').style.display = 'none';
    } catch (error) {
        alert('Signup failed: ' + error.message);
    }
});

// 이메일 로그인
document.getElementById('emailLogin').addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        document.getElementById('authModal').style.display = 'none';
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

// 로그아웃
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        document.getElementById('authModal').style.display = 'none';
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
});

// 모달 닫기
document.querySelector('.auth-close').addEventListener('click', () => {
    document.getElementById('authModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('authModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});