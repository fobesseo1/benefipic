'use client';

import { useEffect, useState } from 'react';

export default function BrowserRedirect() {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isRedirected = urlParams.get('external');

    // referrer가 있고 리다이렉트되지 않은 경우에만
    if (document.referrer && !isRedirected) {
      // 먼저 메시지 표시
      setShowMessage(true);

      // Android인 경우
      if (/android/i.test(navigator.userAgent)) {
        window.location.href = `intent:${window.location.href}#Intent;scheme=https;package=com.android.chrome;end`;
      }
      // iOS인 경우
      else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        window.location.href = `googlechrome://${window.location.href.substring(8)}`;
      }
      // 기타 경우
      else {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('external', 'true');
        window.open(newUrl.toString(), '_system');
      }
    }
  }, []);

  if (!showMessage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <div>
        <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>
          외부 브라우저로 이동합니다
        </h2>
        <p style={{ marginBottom: '20px' }}>
          보안을 위해 외부 브라우저에서 열어야 합니다.
          <br />이 창은 닫으셔도 됩니다.
        </p>
        <button
          onClick={() => window.close()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
          }}
        >
          창 닫기
        </button>
      </div>
    </div>
  );
}
