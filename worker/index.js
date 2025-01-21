//worker/index.js

self.addEventListener('fetch', (event) => {
  // 외부 링크(쿠팡 등) 처리
  if (event.request.url.startsWith('https://link.coupang.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(null, {
          status: 502,
          statusText: 'Bad Gateway',
        });
      })
    );
    return;
  }

  // PWA 내부 네비게이션
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
  }
});
