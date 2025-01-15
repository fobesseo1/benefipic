// app/auth/UserRedirect.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CurrentUserType } from '../types/types';

export const UserRedirect = ({ user }: { user: CurrentUserType }) => {
  const router = useRouter();

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push('/main');
    }, 1500);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold text-gradient-brand">{user.username}님 안녕하세요</h2>
        <p className="text-sm text-gray-500">오늘도 특별한 하루 되세요</p>
      </div>
    </div>
  );
};
