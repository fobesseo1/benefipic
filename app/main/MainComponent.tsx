//app/main/MainComponent.tsx

'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';

import NutritionCard from '../components/shared/ui/NutritionCard';
import FoodLogCard from '../components/shared/ui/FoodLogCard';
import ExerciseLogCard from '../components/shared/ui/ExerciseLogCard';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { FoodLog, ExerciseLog } from '../types/types';
import dynamic from 'next/dynamic';

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

  // 영양 상태 데이터 가져오기
  const fetchNutritionStatus = useCallback(async (date: Date) => {
    try {
      const response = await fetch(`/api/daily-status?date=${date.toISOString()}`);
      const statusData = await response.json();
      setDailyStatus(statusData);
    } catch (error) {
      console.error('Error fetching nutrition status:', error);
    }
  }, []);

  // 식사 기록 데이터 가져오기
  const fetchFoodLogs = useCallback(
    async (date: Date) => {
      try {
        const { utcStart, utcEnd } = getSelectedDateRange(date);
        const { data } = await supabase
          .from('food_logs')
          .select('*')
          .eq('user_id', user_id) // user_id 필터링 추가
          .gte('logged_at', utcStart.toISOString())
          .lte('logged_at', utcEnd.toISOString())
          .order('logged_at', { ascending: false });

        if (data) {
          setFoodLogs(data as FoodLog[]);
        }
      } catch (error) {
        console.error('Error fetching food logs:', error);
      }
    },
    [supabase, user_id] // user_id 의존성 추가
  );

  // 운동 기록 데이터 가져오기
  const fetchExerciseLogs = useCallback(
    async (date: Date) => {
      try {
        const { utcStart, utcEnd } = getSelectedDateRange(date);
        const { data } = await supabase
          .from('exercise_logs')
          .select('*')
          .eq('user_id', user_id) // user_id 필터링 추가
          .gte('logged_at', utcStart.toISOString())
          .lte('logged_at', utcEnd.toISOString())
          .order('logged_at', { ascending: false });

        if (data) {
          setExerciseLogs(data as ExerciseLog[]);
        }
      } catch (error) {
        console.error('Error fetching exercise logs:', error);
      }
    },
    [supabase, user_id] // user_id 의존성 추가
  );

  // 모든 데이터 가져오기
  const fetchAllData = useCallback(
    async (date: Date) => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchNutritionStatus(date),
          fetchFoodLogs(date),
          fetchExerciseLogs(date),
        ]);
      } catch (error) {
        console.error('Error fetching all data:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchNutritionStatus, fetchFoodLogs, fetchExerciseLogs]
  );

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
        .eq('user_id', user_id); // user_id 체크 추가
      if (error) throw error;
      setFoodLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));
      await fetchNutritionStatus(selectedDate);
      await fetchFoodLogs(selectedDate);
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
        .eq('user_id', user_id); // user_id 체크 추가
      if (error) throw error;
      setExerciseLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));
      await fetchNutritionStatus(selectedDate);
      await fetchExerciseLogs(selectedDate);
    } catch (error) {
      console.error('Error deleting exercise log:', error);
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-lg">Loading...</div>
  //     </div>
  //   );
  // }

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
      <div className="w-full aspect-square py-12 px-6 flex flex-col space-y-6">
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
              onDelete={handleFoodDelete}
              onDeleteSuccess={async () => {
                await fetchNutritionStatus(selectedDate);
                await fetchFoodLogs(selectedDate);
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
                await fetchNutritionStatus(selectedDate);
                await fetchExerciseLogs(selectedDate);
              }}
              maxItems={3}
              selectedDate={selectedDate}
              showDeleteButton={false}
              showEditButton={false}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
