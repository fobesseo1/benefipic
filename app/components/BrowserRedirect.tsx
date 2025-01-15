'use client';

import { useEffect, useState } from 'react';

export default function BrowserRedirect() {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // URL에서 리다이렉트 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const isRedirected = urlParams.get('external');

    // referrer가 있고 아직 리다이렉트되지 않은 경우에만 실행
    if (document.referrer && !isRedirected) {
      setShowMessage(true);
      // 현재 URL에 리다이렉트 파라미터 추가
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('external', 'true');
      window.location.href = newUrl.toString();
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
        <h2>외부 브라우저로 이동합니다</h2>
        <p>이 창은 닫으셔도 됩니다.</p>
        <button
          onClick={() => window.close()}
          style={{
            padding: '10px 20px',
            marginTop: '20px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          창 닫기
        </button>
      </div>
    </div>
  );
}
