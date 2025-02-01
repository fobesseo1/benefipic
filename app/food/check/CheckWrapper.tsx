'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import SpeechAnalyzerFood from '@/app/speech/SpeechAnalyzerFood';
import PhotoAnalyzerIcon from '@/app/speech/PhotoAnalyzerIcon ';
import SpeechAnalyzerFoodCheck from '@/app/speech/SpeechAnalyzerFoodCheck';

export default function CheckWrapper({
  currentUser_id,
  newUserCheck,
}: {
  currentUser_id: string;
  newUserCheck: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 mx-4">
      <div className="flex flex-col gap-4  ">
        {/* 입력버튼 */}
        <div className="flex flex-col gap-2">
          <SpeechAnalyzerFoodCheck currentUser_id={currentUser_id} newUserCheck={newUserCheck} />
          <Link href="/food/check/photo-check">
            <PhotoAnalyzerIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}
