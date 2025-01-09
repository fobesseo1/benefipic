//app/food-all/FoodComponent.tsx
'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import FoodLogCard from '../components/shared/ui/FoodLogCard';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { FoodLog } from '../types/types'; // ExerciseLog 제거
import CurrentWeekCalendar from '../main/CurrentWeekCalendar';
import MainLoading from '../Mainloading';

// DailyStatus 타입을 필요한 것만 남기기
type DailyStatus = {
  totalCalories: number;
};

export default function FoodComponent({ user_id }: { user_id: string }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  const getSelectedDateRange = (date: Date) => {
    const koreanDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const start = new Date(koreanDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(koreanDate);
    end.setHours(23, 59, 59, 999);

    return { utcStart: start, utcEnd: end };
  };

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
        </div>
      </div>
    </div>
  );
}
