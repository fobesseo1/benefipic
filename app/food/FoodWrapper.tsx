'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import SpeechAnalyzerFood from '../speech/SpeechAnalyzerFood';
import SpeechAnalyzerFoodCheck from '../speech/SpeechAnalyzerFoodCheck';
import PhotoAnalyzerIcon from '../speech/PhotoAnalyzerIcon ';

export default function FoodWrapper({
  currentUser_id,
  newUserCheck,
}: {
  currentUser_id: string;
  newUserCheck: boolean;
}) {
  const [dailyStatus, setDailyStatus] = useState({
    totalCalories: 0,
    remainingCalories: 0,
  });

  const fetchDailyStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/daily-status?date=' + new Date().toISOString());
      if (!response.ok) throw new Error('Failed to fetch daily status');
      const data = await response.json();
      setDailyStatus(data.status);
    } catch (error) {
      console.error('Error fetching daily status:', error);
    }
  }, []);

  useEffect(() => {
    fetchDailyStatus();
  }, [fetchDailyStatus]);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/food/input">
        <Button variant="outline" className="w-full py-6">
          🥄 식사 기록
        </Button>
      </Link>
      <Link href="/food/check">
        <Button variant="outline" className="w-full py-6">
          🤔 음식 체크(먹을까? 말까?)
        </Button>
      </Link>
    </div>
  );
}
