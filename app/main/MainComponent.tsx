'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import NutritionCard from '../components/shared/ui/NutritionCard';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { FoodLog, ExerciseLog, DailyStatusResponse } from '../types/types';
import dynamic from 'next/dynamic';
import SpeechAnalyzerFood from '../speech/SpeechAnalyzerFood';
import SpeechAnalyzerFoodCheck from '../speech/SpeechAnalyzerFoodCheck';
import SpeechAnalyzerMenu from '../speech/SpeechAnalyzerMenu';
import SpeechAnalyzerExercise from '../speech/SpeechAnalyzerExercise';
import FoodLogCardMain from '../components/shared/ui/FoodLogCardMain';
import ExerciseLogCardMain from '../components/shared/ui/ExerciseLogCardMain';
import { Card } from '@/components/ui/card';
import { Utensils, CheckSquare, FileText, Dumbbell, Speech } from 'lucide-react';
import SpeechAnalyzerActionMenu from '../speech/SpeechAnalyzerActionMenu';
import NutritionCardMain from '../components/shared/ui/NutritionCardMain';
import CalorieMeter from './CalorieMeter';
import SpeechMainAnalyzer from '../speech/SpeechMainAnalyzer';

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
        {/* 캘린더 */}
        <Suspense fallback={<div>Loading food logs...</div>}>
          <CurrentWeekCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </Suspense>
        <Suspense fallback={<div>Loading analyzer...</div>}>
          <SpeechMainAnalyzer
            user_id={user_id}
            newUserCheck={newUserCheck}
            onDataUpdate={refreshMainData}
          />
        </Suspense>

        {/* 음성 또는 직접 입력 */}
        {/* <Suspense fallback={<div>Loading food logs...</div>}>
          <Card className="p-4 flex flex-col gap-2">
            <div className="w-full h-24 grid grid-cols-2 gap-2 tracking-tighter font-semibold">
              <button
                onClick={() => setCurrentAnalyzer('food')}
                className={`border-gray-200 border-2 flex items-center justify-center gap-2 col-span-1 rounded-xl
            ${currentAnalyzer === 'food' ? 'bg-gray-900 text-white' : ''}`}
              >
                🥄 식사 기록
              </button>
              <button
                onClick={() => setCurrentAnalyzer('check')}
                className={`border-gray-200 border-2 flex items-center justify-center gap-2 col-span-1 rounded-xl
            ${currentAnalyzer === 'check' ? 'bg-black text-white' : ''}`}
              >
                🤔 먹을까? 말까?
              </button>
              <button
                onClick={() => setCurrentAnalyzer('menu')}
                className={`border-gray-200 border-2 flex items-center justify-center gap-2 col-span-1 rounded-xl
            ${currentAnalyzer === 'menu' ? 'bg-black text-white' : ''}`}
              >
                🍽️ 메뉴 추천
              </button>
              <button
                onClick={() => setCurrentAnalyzer('exercise')}
                className={`border-gray-200 border-2 flex items-center justify-center gap-2 col-span-1 rounded-xl
            ${currentAnalyzer === 'exercise' ? 'bg-black text-white' : ''}`}
              >
                💪 운동 기록
              </button>
            </div>
            <hr></hr>
     
            {currentAnalyzer === 'food' && (
              <SpeechAnalyzerFood
                currentUser_id={user_id}
                newUserCheck={newUserCheck}
                onDataUpdate={refreshMainData}
              />
            )}
            {currentAnalyzer === 'check' && (
              <SpeechAnalyzerFoodCheck
                currentUser_id={user_id}
                newUserCheck={newUserCheck}
                onDataUpdate={refreshMainData}
              />
            )}
            {currentAnalyzer === 'menu' && (
              <SpeechAnalyzerMenu
                currentUser_id={user_id}
                newUserCheck={newUserCheck}
                onDataUpdate={refreshMainData}
              />
            )}
            {currentAnalyzer === 'exercise' && (
              <SpeechAnalyzerExercise
                currentUser_id={user_id}
                newUserCheck={newUserCheck}
                onDataUpdate={refreshMainData}
              />
            )}
          </Card>
        </Suspense> */}
        {/* 오늘 남은 식사량 */}
        <Suspense fallback={<div>Loading nutrition...</div>}>
          <NutritionCardMain
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
            totalDailyCalories={
              dailyStatus ? dailyStatus.totalCalories + dailyStatus.remainingCalories : 0
            }
          />
        </Suspense>
        {/* 칼로리메타 */}
        {/* <Suspense fallback={<div>Loading food logs...</div>}>
          <CalorieMeter
            title={
              isToday(selectedDate)
                ? '오늘 남은 식사량'
                : `${selectedDate.toLocaleDateString('ko-KR')} 남은 식사량`
            }
            currentCalories={dailyStatus?.totalCalories ?? 0}
            dailyGoal={dailyStatus ? dailyStatus.totalCalories + dailyStatus.remainingCalories : 0}
            nutrition={{
              protein: dailyStatus?.remainingProtein ?? 0,
              fat: dailyStatus?.remainingFat ?? 0,
              carbs: dailyStatus?.remainingCarbs ?? 0,
            }}
          />
        </Suspense> */}

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
