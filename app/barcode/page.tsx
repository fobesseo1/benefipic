'use client';

import { useEffect } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import { useUserStore } from '../store/userStore';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.currentUser);
  const isInitialized = useUserStore((state) => state.isInitialized); // userStore에 이런 플래그 추가 필요

  useEffect(() => {
    if (isInitialized && !currentUser?.id) {
      router.push('/auth');
    }
  }, [isInitialized, currentUser, router]);

  if (!isInitialized || !currentUser?.id) {
    return null;
  }

  return (
    <div>
      <BarcodeScanner />
    </div>
  );
}
