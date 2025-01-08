//app/food-all/FoodComponent.tsx

'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import FoodLogCard from '../components/shared/ui/FoodLogCard';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { FoodLog, ExerciseLog } from '../types/types';
import CurrentWeekCalendar from '../main/CurrentWeekCalendar';
import MainLoading from '../Mainloading';

export type DailyStatus = {
  totalCalories: number;
  remainingCalories: number;
  totalExerciseMinutes: number;
  remainingExerciseMinutes: number;
  remainingProtein: number;
  remainingFat: number;
  remainingCarbs: number;
};

export default function FoodComponent({ user_id }: { user_id: string }) {
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

  // 식사 기록 데이터 가져오기
  const fetchFoodLogs = useCallback(
    async (date: Date) => {
      try {
        const { utcStart, utcEnd } = getSelectedDateRange(date);
        const { data } = await supabase
          .from('food_logs')
          .select('*')
          .eq('user_id', user_id)
          .gte('logged_at', utcStart.toISOString())
          .lte('logged_at', utcEnd.toISOString())
          .order('logged_at', { ascending: false });

        if (data) {
          setFoodLogs(data as FoodLog[]);
        }
      } catch (error) {
        console.error('Error fetching food logs:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  // 날짜가 변경될 때마다 데이터 다시 불러오기
  useEffect(() => {
    fetchFoodLogs(selectedDate);
  }, [selectedDate, fetchFoodLogs]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleFoodDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('food_logs').delete().eq('id', id);
      if (error) throw error;
      setFoodLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));

      await fetchFoodLogs(selectedDate);
    } catch (error) {
      console.error('Error deleting food log:', error);
    }
  };

  const handleFoodUpdate = async (id: string, updatedData: Partial<FoodLog>) => {
    try {
      const { error } = await supabase.from('food_logs').update(updatedData).eq('id', id);

      if (error) throw error;
      setFoodLogs((prevLogs) =>
        prevLogs.map((log) => (log.id === id ? { ...log, ...updatedData } : log))
      );

      // 데이터 다시 불러오기
      await fetchFoodLogs(selectedDate);
    } catch (error) {
      console.error('Error updating food log:', error);
    }
  };

  if (isLoading) {
    return <MainLoading />;
  }

  return (
    <div className="relative min-h-screen min-w-screen flex flex-col overflow-hidden">
      <div className="w-full aspect-square p-4 flex flex-col space-y-6">
        <div className="flex flex-col space-y-6">
          <CurrentWeekCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
        </div>

        <div className="flex flex-col space-y-6">
          <Suspense fallback={<div>Loading food logs...</div>}>
            <FoodLogCard
              foodLogs={foodLogs}
              onDelete={handleFoodDelete}
              onUpdate={handleFoodUpdate}
              onDeleteSuccess={async () => {
                await fetchFoodLogs(selectedDate);
              }}
              onUpdateSuccess={async () => {
                await fetchFoodLogs(selectedDate);
              }}
              selectedDate={selectedDate}
              showMoreButton={false}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
