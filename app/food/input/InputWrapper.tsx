'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import SpeechAnalyzerFood from '@/app/speech/SpeechAnalyzerFood';
import PhotoAnalyzerIcon from '@/app/speech/PhotoAnalyzerIcon ';
import SpeechAnalyzerFoodCheck from '@/app/speech/SpeechAnalyzerFoodCheck';
import FoodLogCard from '@/app/components/shared/ui/FoodLogCard';
import { FoodLog } from '@/app/types/types';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import MainLoading from '@/app/Mainloading';

type DailyStatus = {
  totalCalories?: number;
  remainingCalories?: number;
};

export default function InputWrapper({
  currentUser_id,
  newUserCheck,
}: {
  currentUser_id: string;
  newUserCheck: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  const fetchDailyStatus = useCallback(async (date: Date) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/food-status?date=${date.toISOString()}`);
      const data = await response.json();

      setDailyStatus({
        totalCalories: data.status.totalCalories,
      });
      setFoodLogs(data.foodLogs);
    } catch (error) {
      console.error('Error fetching food status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyStatus(selectedDate);
  }, [selectedDate, fetchDailyStatus]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleFoodDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('food_logs').delete().eq('id', id);
      if (error) throw error;
      await fetchDailyStatus(selectedDate);
    } catch (error) {
      console.error('Error deleting food log:', error);
    }
  };

  const handleFoodUpdate = async (id: string, updatedData: Partial<FoodLog>) => {
    try {
      const { error } = await supabase.from('food_logs').update(updatedData).eq('id', id);
      if (error) throw error;
      await fetchDailyStatus(selectedDate);
    } catch (error) {
      console.error('Error updating food log:', error);
    }
  };

  if (isLoading) {
    return <MainLoading />;
  }

  const totalDailyCalories =
    (dailyStatus?.totalCalories ?? 0) + (dailyStatus?.remainingCalories ?? 0);
  // console.log(totalDailyCalories);

  return (
    <div className="flex flex-col gap-6 mx-4">
      <div className="flex flex-col gap-4  ">
        {/* 입력버튼 */}
        <div className="flex flex-col gap-2">
          <SpeechAnalyzerFood
            currentUser_id={currentUser_id}
            newUserCheck={newUserCheck}
            totalDailyCalories={totalDailyCalories}
          />
          <Link href="/food/input/photo">
            <PhotoAnalyzerIcon />
          </Link>
        </div>
        {/* <hr /> */}
        {/* 푸드all */}
        {/* <div className="flex flex-col space-y-6">
          <Suspense fallback={<div>Loading food logs...</div>}>
            <FoodLogCard
              foodLogs={foodLogs}
              dailyCalorieGoal={dailyStatus?.totalCalories || 2000}
              onDelete={handleFoodDelete}
              onUpdate={handleFoodUpdate}
              onDeleteSuccess={async () => {
                await fetchDailyStatus(selectedDate);
              }}
              onUpdateSuccess={async () => {
                await fetchDailyStatus(selectedDate);
              }}
              selectedDate={selectedDate}
              showMoreButton={false}
            />
          </Suspense>
        </div> */}
      </div>
    </div>
  );
}
