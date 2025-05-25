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

// 다국어 지원 초기화
let currentLang = 'en'; // 기본 언어를 영어로 설정
let translations = {}; // 번역 데이터를 저장할 객체

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
        // 영어를 대체 언어로 사용
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

    // 번역 적용 로직은 나중에 구현
    console.log(`언어가 ${lang}로 변경되었습니다.`);
    
    // 로컬 스토리지에 언어 설정 저장
    localStorage.setItem('preferredLanguage', lang);
}

// 언어 선택 버튼 이벤트 설정
document.addEventListener('DOMContentLoaded', () => {
    // 저장된 언어 설정 또는 브라우저 언어 감지
    const savedLang = localStorage.getItem('preferredLanguage') || detectUserLanguage();
    changeLanguage(savedLang);

    // 언어 선택 버튼에 이벤트 리스너 추가
    const langButtons = document.querySelectorAll('.language-selector button');
    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.getAttribute('data-lang');
            changeLanguage(lang);
        });
    });

    // 필터 버튼에 이벤트 리스너 추가
    const filterButtons = document.querySelectorAll('.filter-container button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 현재 활성화된 버튼 비활성화
            document.querySelector('.filter-container button.active').classList.remove('active');
            // 클릭한 버튼 활성화
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            // 필터링 로직은 나중에 구현
            console.log(`${filter} 필터가 선택되었습니다.`);
        });
    });
});

// 지도 초기화 및 데이터 로드 함수는 나중에 구현