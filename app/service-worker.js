// 캐시 이름 설정
const CACHE_NAME = 'bangdeng-cache-v1';
const OFFLINE_URL = '/offline.html';

// 캐싱할 파일 목록
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/manifest.json',
    '/locales/en.json',
    '/locales/bn.json',
    // 나중에 추가할 이미지, 아이콘 등
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 캐싱 시작');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())  // 새 SW 즉시 활성화
  );
});

// fetch 이벤트 수정 (CORS 오류 방지)
self.addEventListener('fetch', (event) => {
  // 외부 요청은 캐싱 제외 (Firebase, Leaflet 등)
  if (event.request.url.startsWith('http') && 
      !event.request.url.includes('localhost')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => caches.match(OFFLINE_URL))  // 오프라인 시 대체 페이지
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
    console.log('[Service Worker] Fetch', event.request.url);
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 캐시에 있으면 캐시에서 반환
                if (response) {
                    return response;
                }
                // 캐시에 없으면 네트워크 요청
                return fetch(event.request)
                    .then(res => {
                        // 응답을 복제하고 캐시에 저장
                        return caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request.url, res.clone());
                                return res;
                            });
                    })
                    .catch(err => {
                        console.log('Fetch failed:', err);
                        // 네트워크 요청 실패 시 오프라인 페이지 등 대체 콘텐츠 제공 가능
                    });
            })
    );
});