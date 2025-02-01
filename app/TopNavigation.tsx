'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function TopNavigation({ topNavigationTitle }: { topNavigationTitle: string }) {
  const router = useRouter();
  return (
    <div className="w-full   flex items-center justify-between p-4 pb-0 ">
      <button className="w-6 h-6 flex items-center justify-center" onClick={() => router.back()}>
        <ChevronLeft className="w-5 h-5" />
      </button>
      <p className="text-lg font-semibold">{topNavigationTitle}</p>
      <button className="w-6 h-6 flex items-center justify-center"></button>
    </div>
  );
}
