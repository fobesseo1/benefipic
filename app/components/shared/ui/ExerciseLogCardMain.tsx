'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ExerciseLog } from '@/app/types/types';
import { Timer, Flame, Eraser, Pencil, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import ExerciseShareButton from './ExerciseShareButton';
import { FaWalking, FaRunning, FaSwimmer } from 'react-icons/fa';
import { GrYoga } from 'react-icons/gr';
import { Bike, Dumbbell, Plus, Mountain } from 'lucide-react';
import {
  exerciseDatabase,
  findIconByExerciseName,
  getExerciseIcon,
} from '@/app/exercise-description/exerciseDatabase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

export interface ExerciseLogCardProps {
  exerciseLogs: ExerciseLog[];
  className?: string;
  onDelete?: (id: string) => Promise<void>;
  onUpdate?: (id: string, updatedData: Partial<ExerciseLog>) => Promise<void>;
  onDeleteSuccess?: () => Promise<void>;
  onUpdateSuccess?: () => Promise<void>;
  maxItems?: number;
  selectedDate: Date;
  showMoreButton?: boolean;
  showDeleteButton?: boolean;
  showEditButton?: boolean;
  moreButtonLink?: string;
}

interface EditableExercise {
  exercise_name: string;
  duration_minutes: number;
  calories_burned: number;
  calories_per_hour: number;
}

// 아이콘 매핑 함수

const calculateCalories = (caloriesPerHour: number, durationMinutes: number) => {
  return Math.round((caloriesPerHour * durationMinutes) / 60);
};

export const ExerciseLogCardMain = ({
  exerciseLogs,
  className = '',
  onDelete,
  onUpdate,
  onDeleteSuccess,
  onUpdateSuccess,
  maxItems,
  selectedDate,
  showMoreButton = true,
  showDeleteButton = true,
  showEditButton = true,
  moreButtonLink = '/exercise-all',
}: ExerciseLogCardProps) => {
  const [editingExercise, setEditingExercise] = useState<EditableExercise>({
    exercise_name: '',
    duration_minutes: 0,
    calories_burned: 0,
    calories_per_hour: 0,
  });
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [search, setSearch] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customCaloriesPerHour, setCustomCaloriesPerHour] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ExerciseLog | null>(null);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const displayLogs = maxItems ? exerciseLogs.slice(0, maxItems) : exerciseLogs;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

    return kstDate.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      if (onDelete) {
        await onDelete(id);
        if (onDeleteSuccess) {
          await onDeleteSuccess();
        }
      }
    } catch (error) {
      console.error('Failed to delete exercise log:', error);
    }
  };

  const handleEdit = (log: ExerciseLog) => {
    const calories_per_hour =
      log.calories_per_hour || Math.round((log.calories_burned * 60) / log.duration_minutes);

    setEditingExercise({
      exercise_name: log.exercise_name,
      duration_minutes: log.duration_minutes,
      calories_burned: log.calories_burned,
      calories_per_hour: calories_per_hour,
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      if (onUpdate) {
        const { calories_per_hour, ...updateData } = editingExercise;
        await onUpdate(id, updateData);
        if (onUpdateSuccess) {
          await onUpdateSuccess();
        }
      }
    } catch (error) {
      console.error('Failed to update exercise log:', error);
    }
  };

  const filteredExercises = exerciseDatabase.filter((exercise) =>
    exercise.name.toLowerCase().includes(search.toLowerCase())
  );

  const calculateTotalCalories = (caloriesPerHour: number, durationMinutes: number): number => {
    return Math.round((caloriesPerHour / 60) * durationMinutes);
  };

  // 컴포넌트 내부에 상태 추가
  const showPlusButton = maxItems === 3 && displayLogs.length === 3 && exerciseLogs.length > 3;

  return (
    <>
      <Card className={`p-4 pb-2  ${className}`}>
        {/* 헤더 부분 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold mb-3">
            {isToday(selectedDate)
              ? '오늘 한 운동'
              : `${selectedDate.toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                })} 한 운동`}
          </h3>
          {showMoreButton && (
            <div className="flex items-center gap-2 mb-3">
              <Link href={moreButtonLink}>
                <button className="font-semibold text-gray-400">더보기</button>
              </Link>
              <p className="font-semibold text-gray-400 ">|</p>
              <Link href="/exercise">
                <button className="font-semibold text-gray-600 ">+ 입력</button>
              </Link>
            </div>
          )}
        </div>

        <Swiper
          modules={[FreeMode, Pagination]}
          spaceBetween={16}
          slidesPerView={'auto'}
          freeMode={true}
          pagination={{
            clickable: true,
          }}
          className="w-full"
        >
          {displayLogs.map((log) => {
            const IconComponent = getExerciseIcon(findIconByExerciseName(log.exercise_name));

            return (
              <SwiperSlide key={log.id} style={{ width: '60%' }}>
                <Card className="p-2">
                  <div key={log.id} className="rounded-lg bg-white">
                    {/* 이미지/아이콘 영역 */}
                    <div className="relative w-full aspect-square">
                      {log.image_url ? (
                        <Image
                          src={log.image_url}
                          alt={log.exercise_name}
                          fill
                          sizes="100vw"
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 rounded-t-lg flex items-center justify-center p-4">
                          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                            {IconComponent ? (
                              <IconComponent className="w-24 h-24 text-gray-600" />
                            ) : (
                              <p className="text-center font-semibold text-4xl text-gray-400">
                                {log.exercise_name.slice(0, 6)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 정보 영역 */}
                    <div className="pt-4">
                      {/* 운동 이름과 시간 */}
                      <div className="grid grid-cols-4 items-end tracking-tighter border-b-[1px] border-gray-600">
                        <p className="col-span-3 font-bold text-gray-900 line-clamp-1">
                          {log.exercise_name}
                        </p>
                        <p className="col-span-1 text-sm text-gray-400 text-end">
                          {formatTime(log.logged_at)}
                        </p>
                      </div>

                      {/* 운동 상세 정보 */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center tracking-tighter gap-[2px] ">
                          <Flame size={16} className="text-rose-600" />
                          <p className="text-rose-600 text-lg font-bold">
                            {log.calories_burned}
                            <span className="text-rose-600 text-xs"> kcal</span>
                          </p>
                        </div>
                        <div className="flex items-center tracking-tighter ">
                          <Timer size={16} className="text-gray-600" />
                          <p className="text-gray-600 text-lg font-bold">
                            {log.duration_minutes}
                            <span className="text-gray-600 text-xs"> 분</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </SwiperSlide>
            );
          })}

          {/* 빈 상태 메시지 */}
          {displayLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">오늘 기록된 운동이 없습니다</div>
          )}
        </Swiper>
      </Card>

      {/* 운동 수정 다이얼로그 */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>운동 정보 수정</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 검색 영역 */}
            <div className="relative">
              <Input
                type="text"
                placeholder="운동 검색..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                className="w-full pl-10"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />

              {search && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                  {filteredExercises.length > 0 ? (
                    filteredExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setCustomExerciseName(exercise.name);
                          setCustomCaloriesPerHour(exercise.caloriesPerHour);
                          setSearch('');
                        }}
                      >
                        {exercise.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">검색 결과가 없습니다</div>
                  )}
                </div>
              )}
            </div>

            {/* 입력 폼 영역 */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="text-sm text-gray-600">운동명</label>
                <Input
                  type="text"
                  value={customExerciseName}
                  onChange={(e) => setCustomExerciseName(e.target.value)}
                  placeholder="운동 이름을 입력하세요"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">시간당 소모 칼로리</label>
                <Input
                  type="number"
                  value={customCaloriesPerHour || ''}
                  onChange={(e) => setCustomCaloriesPerHour(parseInt(e.target.value) || 0)}
                  placeholder="시간당 소모 칼로리를 입력하세요"
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">운동 시간 (분)</label>
                <Input
                  type="number"
                  value={selectedLog?.duration_minutes || ''} // 기본값을 빈 문자열로 변경
                  onChange={(e) => {
                    if (selectedLog) {
                      setSelectedLog({
                        ...selectedLog,
                        duration_minutes: parseInt(e.target.value) || 0,
                      });
                    }
                  }}
                  placeholder="운동 시간을 입력하세요"
                  min={0}
                />
              </div>

              {/* 총 소모 칼로리 표시 */}
              {customCaloriesPerHour > 0 && selectedLog?.duration_minutes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-rose-600" />
                      <span className="text-gray-600">총 소모 칼로리</span>
                    </div>
                    <p className="text-xl font-bold">
                      {calculateTotalCalories(customCaloriesPerHour, selectedLog.duration_minutes)}
                      <span className="text-sm text-gray-600"> kcal</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSearchModal(false);
                  setCustomExerciseName('');
                  setCustomCaloriesPerHour(0);
                  setSearch('');
                }}
              >
                취소
              </Button>
              <Button
                onClick={async () => {
                  if (selectedLog && onUpdate && customExerciseName && customCaloriesPerHour) {
                    const totalCalories = calculateTotalCalories(
                      customCaloriesPerHour,
                      selectedLog.duration_minutes
                    );

                    await onUpdate(selectedLog.id, {
                      exercise_name: customExerciseName,
                      calories_per_hour: customCaloriesPerHour,
                      calories_burned: totalCalories,
                      duration_minutes: selectedLog.duration_minutes,
                    });
                    if (onUpdateSuccess) {
                      await onUpdateSuccess();
                    }
                  }
                  setShowSearchModal(false);
                  setCustomExerciseName('');
                  setCustomCaloriesPerHour(0);
                  setSearch('');
                }}
                className="bg-gray-800 px-6"
              >
                수정하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExerciseLogCardMain;
