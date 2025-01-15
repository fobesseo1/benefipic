'use client';

import { useEffect, useState } from 'react';

export default function BrowserRedirect() {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isRedirected = urlParams.get('external');

    if (document.referrer && !isRedirected) {
      setShowMessage(true);

      // 먼저 새 창 열기
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('external', 'true');

      // 시스템 브라우저로 열기 시도
      const opened = window.open(newUrl.toString(), '_system');

      // 새 창이 성공적으로 열렸을 때만 현재 창 처리
      if (opened) {
        // 약간의 지연 후 현재 창 내용 변경
        setTimeout(() => {
          document.body.innerHTML = `
            <div style="
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: white;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
              <div>
                <h2 style="margin-bottom: 16px;">외부 브라우저로 이동했습니다</h2>
                <p style="margin-bottom: 20px;">이 창은 닫으셔도 됩니다.</p>
                <button 
                  onclick="window.close()"
                  style="
                    padding: 10px 20px;
                    background: #007AFF;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                  "
                >
                  창 닫기
                </button>
              </div>
            </div>
          `;
        }, 1000);
      }
    }
  }, []);

  return null;
}
