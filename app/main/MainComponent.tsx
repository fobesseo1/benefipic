'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { FoodLog, ExerciseLog, DailyStatusResponse } from '../types/types';
import dynamic from 'next/dynamic';

import FoodLogCardMain from '../components/shared/ui/FoodLogCardMain';
import ExerciseLogCardMain from '../components/shared/ui/ExerciseLogCardMain';

import SpeechMainAnalyzer from '../speech/SpeechMainAnalyzer';
import NutritionCardNew from '../components/shared/ui/NutritionCardMainNew';

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

export default function MainComponent({
  user_id,
  newUserCheck,
}: {
  user_id: string;
  newUserCheck: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAnalyzer, setCurrentAnalyzer] = useState<'food' | 'check' | 'menu' | 'exercise'>(
    'food'
  );
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

  // 데이터 가져오기
  const fetchAllData = useCallback(async (date: Date) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/daily-status?date=${date.toISOString()}`);
      const data: DailyStatusResponse = await response.json();

      setDailyStatus(data.status);
      setFoodLogs(data.foodLogs);
      setExerciseLogs(data.exerciseLogs);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 데이터 갱신
  const refreshMainData = useCallback(() => {
    fetchAllData(selectedDate);
  }, [selectedDate, fetchAllData]);

  useEffect(() => {
    fetchAllData(selectedDate);
  }, [selectedDate, fetchAllData]);

  // 삭제 핸들러
  const handleFoodDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);
      if (error) throw error;
      refreshMainData();
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
      refreshMainData();
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
      <div className="w-full aspect-square p-4 flex flex-col space-y-4">
        {/* <EtcPage /> */}
        {/* 캘린더 */}
        <Suspense fallback={<div>Loading food logs...</div>}>
          <CurrentWeekCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </Suspense>
        <Suspense fallback={<div>Loading analyzer...</div>}>
          <SpeechMainAnalyzer
            user_id={user_id}
            newUserCheck={newUserCheck}
            onDataUpdate={refreshMainData}
            totalDailyCalories={
              dailyStatus ? dailyStatus.totalCalories + dailyStatus.remainingCalories : 0
            }
          />
        </Suspense>

        {/* 오늘 남은 식사량 */}
        <Suspense fallback={<div>Loading nutrition...</div>}>
          <NutritionCardNew
            title={
              isToday(selectedDate)
                ? '오늘 남은 식사량'
                : `${selectedDate.toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                  })} 남은 식사량`
            }
            nutrition={{
              calories: dailyStatus?.remainingCalories || 0,
              protein: dailyStatus?.remainingProtein || 0,
              fat: dailyStatus?.remainingFat || 0,
              carbs: dailyStatus?.remainingCarbs || 0,
            }}
            totalDailyCalories={
              dailyStatus ? dailyStatus.totalCalories + dailyStatus.remainingCalories : 0
            }
          />
        </Suspense>

        {/* 오늘먹은 음식 */}
        <div className="flex flex-col space-y-6">
          <Suspense fallback={<div>Loading food logs...</div>}>
            <FoodLogCardMain
              foodLogs={foodLogs}
              dailyCalorieGoal={dailyStatus?.totalCalories || 2000}
              onDelete={handleFoodDelete}
              onDeleteSuccess={async () => {
                await fetchAllData(selectedDate);
              }}
              selectedDate={selectedDate}
              showDeleteButton={false}
              showEditButton={false}
            />
          </Suspense>

          <Suspense fallback={<div>Loading exercise logs...</div>}>
            <ExerciseLogCardMain
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
