'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import NutritionCard from '../components/shared/ui/NutritionCard';
import FoodLogCard from '../components/shared/ui/FoodLogCard';
import ExerciseLogCard from '../components/shared/ui/ExerciseLogCard';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { FoodLog, ExerciseLog, DailyStatusResponse } from '../types/types';
import dynamic from 'next/dynamic';
import NutritionBatteryGroup from './NutritionBattery';

const CurrentWeekCalendar = dynamic(() => import('./CurrentWeekCalendar'), { ssr: false });

export type DailyStatus = {
  totalCalories: number;
  remainingCalories: number;
  totalExerciseMinutes: number;
  remainingExerciseMinutes: number;
  remainingProtein: number;
  remainingFat: number;
  remainingCarbs: number;
};

export default function MainComponent({ user_id }: { user_id: string }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  // 날짜 범위 가져오기
  const getSelectedDateRange = (date: Date) => {
    const koreanDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const start = new Date(koreanDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(koreanDate);
    end.setHours(23, 59, 59, 999);

    return { utcStart: start, utcEnd: end };
  };

  // 모든 데이터 가져오기
  const fetchAllData = useCallback(async (date: Date) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/daily-status?date=${date.toISOString()}`);
      const data: DailyStatusResponse = await response.json();

      setDailyStatus(data.status);
      setFoodLogs(data.foodLogs);
      setExerciseLogs(data.exerciseLogs);
    } catch (error) {
      console.error('Error fetching all data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 날짜가 변경될 때마다 데이터 다시 불러오기
  useEffect(() => {
    fetchAllData(selectedDate);
  }, [selectedDate, fetchAllData]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleFoodDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);
      if (error) throw error;
      await fetchAllData(selectedDate); // Refresh all data after deletion
    } catch (error) {
      console.error('Error deleting food log:', error);
    }
  };

  const handleExerciseDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exercise_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);
      if (error) throw error;
      await fetchAllData(selectedDate); // Refresh all data after deletion
    } catch (error) {
      console.error('Error deleting exercise log:', error);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="relative min-h-screen min-w-screen flex flex-col overflow-hidden">
      <div className="w-full aspect-square p-4 flex flex-col space-y-6">
        <div className="flex flex-col space-y-6">
          <CurrentWeekCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
          <Suspense fallback={<div>Loading nutrition...</div>}>
            <NutritionCard
              title={
                isToday(selectedDate)
                  ? '오늘 남은 식사량'
                  : `${selectedDate.toLocaleDateString('ko-KR')} 남은 식사량`
              }
              nutrition={{
                calories: dailyStatus?.remainingCalories || 0,
                protein: dailyStatus?.remainingProtein || 0,
                fat: dailyStatus?.remainingFat || 0,
                carbs: dailyStatus?.remainingCarbs || 0,
              }}
            />
          </Suspense>
        </div>

        <div className="flex flex-col space-y-6">
          <Suspense fallback={<div>Loading food logs...</div>}>
            <FoodLogCard
              foodLogs={foodLogs}
              dailyCalorieGoal={dailyStatus?.totalCalories || 2000}
              onDelete={handleFoodDelete}
              onDeleteSuccess={async () => {
                await fetchAllData(selectedDate);
              }}
              maxItems={3}
              selectedDate={selectedDate}
              showDeleteButton={false}
              showEditButton={false}
            />
          </Suspense>

          <Suspense fallback={<div>Loading exercise logs...</div>}>
            <ExerciseLogCard
              exerciseLogs={exerciseLogs}
              onDelete={handleExerciseDelete}
              onDeleteSuccess={async () => {
                await fetchAllData(selectedDate);
              }}
              maxItems={3}
              selectedDate={selectedDate}
              showDeleteButton={false}
              showEditButton={false}
            />
          </Suspense>

          {/* <Suspense fallback={<div>loading...</div>}>
            <NutritionBatteryGroup />
          </Suspense> */}
        </div>
      </div>
    </div>
  );
}
