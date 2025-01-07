//app/exercise-all/ExerciseComponent.tsx

'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import NutritionCard from '../components/shared/ui/NutritionCard';
import FoodLogCard from '../components/shared/ui/FoodLogCard';
import ExerciseLogCard from '../components/shared/ui/ExerciseLogCard';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { FoodLog, ExerciseLog } from '../types/types';
import CurrentWeekCalendar from '../main/CurrentWeekCalendar';

export type DailyStatus = {
  totalCalories: number;
  remainingCalories: number;
  totalExerciseMinutes: number;
  remainingExerciseMinutes: number;
  remainingProtein: number;
  remainingFat: number;
  remainingCarbs: number;
};

export default function ExerciseComponent({ user_id }: { user_id: string }) {
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

  // 운동 기록 데이터 가져오기
  const fetchExerciseLogs = useCallback(
    async (date: Date) => {
      try {
        const { utcStart, utcEnd } = getSelectedDateRange(date);
        const { data } = await supabase
          .from('exercise_logs')
          .select('*')
          .eq('user_id', user_id)
          .gte('logged_at', utcStart.toISOString())
          .lte('logged_at', utcEnd.toISOString())
          .order('logged_at', { ascending: false });

        if (data) {
          setExerciseLogs(data as ExerciseLog[]);
        }
      } catch (error) {
        console.error('Error fetching exercise logs:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  // 날짜가 변경될 때마다 데이터 다시 불러오기
  useEffect(() => {
    fetchExerciseLogs(selectedDate);
  }, [selectedDate, fetchExerciseLogs]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleExerciseDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('exercise_logs').delete().eq('id', id);
      if (error) throw error;
      setExerciseLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));
      // 운동 삭제 후 영양 상태와 운동 로그만 업데이트

      await fetchExerciseLogs(selectedDate);
    } catch (error) {
      console.error('Error deleting exercise log:', error);
    }
  };

  const handleExerciseUpdate = async (id: string, updatedData: Partial<FoodLog>) => {
    try {
      const { error } = await supabase.from('exercise_logs').update(updatedData).eq('id', id);

      if (error) throw error;
      setExerciseLogs((prevLogs) =>
        prevLogs.map((log) => (log.id === id ? { ...log, ...updatedData } : log))
      );

      // 데이터 다시 불러오기
      await fetchExerciseLogs(selectedDate);
    } catch (error) {
      console.error('Error updating exercise log:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen min-w-screen flex flex-col overflow-hidden">
      <div className="w-full aspect-square py-12 px-6 flex flex-col space-y-6">
        <div className="flex flex-col space-y-6">
          <CurrentWeekCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
        </div>

        <div className="flex flex-col space-y-6">
          <Suspense fallback={<div>Loading exercise logs...</div>}>
            <ExerciseLogCard
              exerciseLogs={exerciseLogs}
              onDelete={handleExerciseDelete}
              onDeleteSuccess={async () => {
                await fetchExerciseLogs(selectedDate);
              }}
              onUpdate={handleExerciseUpdate}
              onUpdateSuccess={async () => {
                await fetchExerciseLogs(selectedDate);
              }}
              maxItems={3}
              selectedDate={selectedDate}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
