'use client';

import { useEffect, useState } from 'react';
import MobileOnlyMessage from './MobileOnlyMessage';

export default function MobileDetector({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true); // 기본값 true로 설정하여 깜빡임 방지

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsMobile(/mobile|iphone|ipad|android/.test(userAgent));
  }, []);

  if (!isMobile) {
    return <MobileOnlyMessage />;
  }

  return <>{children}</>;
}
