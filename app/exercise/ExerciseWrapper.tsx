'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import SpeechAnalyzerFood from '@/app/speech/SpeechAnalyzerFood';
import PhotoAnalyzerIcon from '@/app/speech/PhotoAnalyzerIcon ';
import SpeechAnalyzerFoodCheck from '@/app/speech/SpeechAnalyzerFoodCheck';
import FoodLogCard from '@/app/components/shared/ui/FoodLogCard';
import { ExerciseLog, FoodLog } from '@/app/types/types';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import MainLoading from '@/app/Mainloading';
import SpeechAnalyzerExercise from '../speech/SpeechAnalyzerExercise';
import ExerciseLogCard from '../components/shared/ui/ExerciseLogCard';

type DailyStatus = {
  totalCalories?: number;
  remainingCalories?: number;
};

export default function ExerciseWrapper({
  currentUser_id,
  newUserCheck,
}: {
  currentUser_id: string;
  newUserCheck: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
          .eq('user_id', currentUser_id)
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

  const handleExerciseUpdate = async (id: string, updatedData: Partial<ExerciseLog>) => {
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
    return <MainLoading />;
  }

  return (
    <div className="flex flex-col gap-6 mx-4">
      <div className="flex flex-col gap-4  ">
        {/* 입력버튼 */}
        <div className="flex flex-col gap-2">
          <SpeechAnalyzerExercise currentUser_id={currentUser_id} newUserCheck={newUserCheck} />
          <Link href="/exercise/photo">
            <PhotoAnalyzerIcon />
          </Link>
        </div>
        <hr />
        {/* exercise-all */}
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
              selectedDate={selectedDate}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
