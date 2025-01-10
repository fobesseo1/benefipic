'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ExerciseLog } from '@/app/types/types';
import { Timer, Flame, Eraser, Pencil } from 'lucide-react';
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
import { FaWalking, FaRunning, FaSwimmer } from 'react-icons/fa';
import { GrYoga } from 'react-icons/gr';
import { Bike, Dumbbell, Plus, Mountain } from 'lucide-react';
import Link from 'next/link';
import ExerciseShareButton from './ExerciseShareButton';

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
const getExerciseIcon = (exerciseName: string) => {
  const iconMap = {
    걷기: FaWalking,
    달리기: FaRunning,
    수영: FaSwimmer,
    요가: GrYoga,
    자전거: Bike,
    웨이트: Dumbbell,
    등산: Mountain,
    직접입력: Plus,
  };
  return iconMap[exerciseName as keyof typeof iconMap];
};

const calculateCalories = (caloriesPerHour: number, durationMinutes: number) => {
  return Math.round((caloriesPerHour * durationMinutes) / 60);
};

export const ExerciseLogCard = ({
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

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold mb-3">
          {isToday(selectedDate)
            ? '오늘 한 운동'
            : `${selectedDate.toLocaleDateString('ko-KR')} 한 운동`}
        </h3>
        {showMoreButton && (
          <Link href={moreButtonLink}>
            <h3 className="font-semibold mb-3 text-gray-400">...더보기</h3>
          </Link>
        )}
      </div>
      <div className="space-y-4 min-h-28">
        {displayLogs.map((log) => {
          const IconComponent = getExerciseIcon(log.exercise_name);

          return (
            <div key={log.id} className="flex gap-4 rounded-lg shadow-sm">
              <div className="relative min-h-28 aspect-square rounded-lg overflow-hidden flex items-center justify-center bg-gray-200">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                  {IconComponent ? (
                    <IconComponent className="w-12 h-12 text-gray-400" />
                  ) : (
                    <span className="text-3xl font-semibold text-gray-400">
                      {log.exercise_name[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-full flex-1 flex flex-col">
                <div className="grid grid-cols-4 items-end tracking-tighter">
                  <p className="col-span-3 text-lg font-bold text-gray-900 line-clamp-1">
                    {log.exercise_name}
                  </p>
                  <p className="col-span-1 text-sm text-gray-600 text-end">
                    {formatTime(log.logged_at)}
                  </p>
                </div>
                <div className="flex flex-col mt-2">
                  <div className="flex items-center tracking-tighter gap-1">
                    <div className="flex items-center gap-1 ">
                      <Flame size={16} color="#4b5563" />
                      <div className="flex items-center gap-[2px]">
                        <p className="text-gray-600 font-bold">{log.calories_burned}</p>
                        <span className="text-gray-600 text-xs">kcal</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center tracking-tighter gap-1">
                    <div className="flex items-center gap-1">
                      <Timer size={16} className="text-gray-600" />
                      <div className="flex items-center gap-[2px]">
                        <p className="text-gray-500 font-bold">{log.duration_minutes}</p>
                        <span className="text-gray-500 text-xs">분</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full mt-3 grid grid-cols-3 gap-2">
                  {showEditButton && <ExerciseShareButton log={log} />}

                  {showEditButton && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <div
                          onClick={() => handleEdit(log)}
                          className="py-1 px-1 bg-gray-50 flex justify-center items-center cursor-pointer rounded-lg hover:bg-gray-600 group"
                        >
                          <Pencil size={16} className="text-gray-400 group-hover:text-white" />
                          <p className="text-sm text-gray-400 group-hover:text-white">수정</p>
                        </div>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>운동 정보 수정</AlertDialogTitle>
                          <AlertDialogDescription>
                            수정할 정보를 입력해주세요.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="grid gap-4 py-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">운동 이름</label>
                            <Input
                              value={editingExercise.exercise_name}
                              onChange={(e) =>
                                setEditingExercise((prev) => ({
                                  ...prev,
                                  exercise_name: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">운동 시간 (분)</label>
                            <Input
                              type="number"
                              value={editingExercise.duration_minutes || ''}
                              onChange={(e) => {
                                const duration = e.target.value === '' ? 0 : Number(e.target.value);
                                const newCalories = calculateCalories(
                                  editingExercise.calories_per_hour,
                                  duration
                                );
                                setEditingExercise((prev) => ({
                                  ...prev,
                                  duration_minutes: duration,
                                  calories_burned: newCalories,
                                }));
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">소모 칼로리 (kcal)</label>
                            <Input
                              type="number"
                              value={editingExercise.calories_burned}
                              disabled
                              className="bg-gray-100"
                            />
                          </div>
                        </div>

                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleUpdate(log.id)}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            수정하기
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {showDeleteButton && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <div className="py-1 px-1 bg-gray-50 flex justify-center items-center  cursor-pointer rounded-lg hover:bg-gray-600 group">
                          <Eraser size={16} className="text-gray-400 group-hover:text-white" />
                          <p className="text-sm text-gray-400 group-hover:text-white">삭제</p>
                        </div>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>운동 기록 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            {log.exercise_name} 기록을 삭제하시겠습니까?
                            <br />
                            삭제된 기록은 복구할 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>돌아가기</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(log.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            삭제하기
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {exerciseLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">오늘 기록된 운동이 없습니다</div>
        )}
      </div>
    </Card>
  );
};

export default ExerciseLogCard;
