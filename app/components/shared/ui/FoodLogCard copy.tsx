'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { FoodLog } from '@/app/types/types';
import {
  Beef,
  ChefHat,
  CircleX,
  Droplet,
  Eraser,
  Flame,
  Pencil,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';

export interface FoodLogCardProps {
  foodLogs: FoodLog[];
  dailyCalorieGoal: number;
  className?: string;
  onDelete?: (id: string) => Promise<void>; // optional로 변경
  onUpdate?: (id: string, updatedData: Partial<FoodLog>) => Promise<void>; // optional로 변경
  onDeleteSuccess?: () => Promise<void>;
  onUpdateSuccess?: () => Promise<void>;
  maxItems?: number;
  selectedDate: Date;
  showMoreButton?: boolean;
  showDeleteButton?: boolean;
  showEditButton?: boolean;
  moreButtonLink?: string;
}

interface EditableFood {
  food_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export const FoodLogCard = ({
  foodLogs,
  dailyCalorieGoal,
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
  moreButtonLink = '/food-all',
}: FoodLogCardProps) => {
  const [editingFood, setEditingFood] = useState<EditableFood>({
    food_name: '',
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const displayLogs = maxItems ? foodLogs.slice(0, maxItems) : foodLogs;

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
        // onDelete가 있을 때만 실행
        await onDelete(id);
        if (onDeleteSuccess) {
          await onDeleteSuccess();
        }
      }
    } catch (error) {
      console.error('Failed to delete food log:', error);
    }
  };

  const handleEdit = (log: FoodLog) => {
    setEditingFood({
      food_name: log.food_name,
      calories: log.calories,
      protein: log.protein,
      fat: log.fat,
      carbs: log.carbs,
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      if (onUpdate) {
        // onUpdate가 있을 때만 실행
        await onUpdate(id, editingFood);
        if (onUpdateSuccess) {
          await onUpdateSuccess();
        }
      }
    } catch (error) {
      console.error('Failed to update food log:', error);
    }
  };

  function roundToInteger(number: number) {
    return Math.round(number);
  }

  // 점수 계산 함수 추가
  const calculateHealthScore = (foodLog: FoodLog, dailyCalorieGoal: number) => {
    let score = 6; // 기본 점수

    // 1. 칼로리 밀도 점수 (최대 2점)
    // 칼로리가 낮으면서 단백질이 높은 음식 보상
    const caloriePerProteinRatio = foodLog.calories / (foodLog.protein + 1); // +1은 0 나누기 방지
    if (caloriePerProteinRatio < 15) {
      // 복어회, 닭가슴살 같은 고단백 저칼로리 음식
      score += 2;
    } else if (caloriePerProteinRatio < 25) {
      score += 1;
    }

    // 2. 영양소 균형 점수 (최대 2점)
    // 단백질 비중이 높고 지방이 적절한 음식 보상
    const proteinRatio = (foodLog.protein * 4) / foodLog.calories;
    const fatRatio = (foodLog.fat * 9) / foodLog.calories;

    if (proteinRatio > 0.3 && fatRatio < 0.3) {
      // 복어회, 연어회 같은 건강한 단백질 음식
      score += 2;
    } else if (proteinRatio > 0.2 && fatRatio < 0.35) {
      score += 1;
    }

    return Math.min(10, score);
  };

  // 점수에 따른 색상 반환 함수
  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-gray-800';
    if (score >= 7) return 'text-gray-600';
    if (score >= 5) return 'text-gray-400';
    return 'text-red-500';
  };

  return (
    <Card className={`p-4 ${className}`}>
      {/* 기존 헤더 부분 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold mb-3">
          {isToday(selectedDate)
            ? '오늘 먹은 음식'
            : `${selectedDate.toLocaleDateString('ko-KR')} 먹은 음식`}
        </h3>
        {showMoreButton && (
          <Link href={moreButtonLink}>
            <h3 className="font-semibold mb-3 text-gray-400">...더보기</h3>
          </Link>
        )}
      </div>

      <div className="space-y-4 min-h-28">
        {displayLogs.map((log) => (
          <div key={log.id} className="flex items-center gap-4 rounded-lg shadow-sm h-full">
            {/* 이미지 부분 */}
            <div className="relative min-h-28 aspect-square rounded-lg overflow-hidden">
              {log.image_url ? (
                <Image
                  src={log.image_url}
                  alt={log.food_name}
                  fill
                  sizes="100vw"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center p-2">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <UtensilsCrossed size={48} color="#9ca3af" />
                  </div>
                </div>
              )}
            </div>

            {/* 음식 정보 부분 */}
            <div className="min-h-28 flex-1 flex flex-col  ">
              {/* 기존 정보 표시 부분 */}
              <div className="grid grid-cols-4 items-end tracking-tighter">
                <p className="col-span-3 text-base font-bold text-gray-900 line-clamp-1">
                  {log.food_name}
                </p>
                <p className="col-span-1 text-sm  text-gray-400 text-end">
                  {formatTime(log.logged_at)}
                </p>
              </div>
              {/* <hr className="mt-2" /> */}
              <div className="flex flex-col mt-1">
                <div className="flex items-center tracking-tighter">
                  <Flame size={16} color="#4b5563" />
                  <div className="flex items-center gap-[2px]">
                    <p className="text-gray-600 font-bold">{log.calories}</p>
                    <span className="text-gray-600 text-xs">kcal</span>
                  </div>
                </div>
                <div className="flex justify-between items-center tracking-tighter text-sm ">
                  <div className="flex items-center tracking-tighter">
                    <Beef size={16} color="#4b5563" />
                    <div className="flex items-center gap-[2px]">
                      <p className="text-gray-600 font-bold text-sm">
                        {roundToInteger(log.protein)}
                      </p>
                      <span className="text-gray-600 text-xs">g</span>
                    </div>
                  </div>
                  <div className="flex items-center tracking-tighter ">
                    <Droplet size={16} color="#4b5563" />
                    <div className="flex items-center gap-[2px]">
                      <p className="text-gray-600 font-bold text-sm">{roundToInteger(log.fat)}</p>
                      <span className="text-gray-600 text-xs">g</span>
                    </div>
                  </div>
                  <div className="flex items-center tracking-tighter">
                    <Wheat size={16} color="#4b5563" />
                    <div className="flex items-center gap-[2px]">
                      <p className="text-gray-600 font-bold text-sm">{roundToInteger(log.carbs)}</p>
                      <span className="text-gray-600 text-xs">g</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 버튼 그룹 */}
              <div className="w-full mt-1 flex justify-between items-center gap-2">
                <div className="flex items-center gap-1 tracking-tighter text-sm">
                  <div className="text-gray-600 flex items-center ">
                    <ChefHat size={20} /> <span>:</span>
                  </div>
                  <p
                    className={`font-bold text-lg ${getScoreColor(
                      calculateHealthScore(log, dailyCalorieGoal) // 하드코딩된 2000 대신 prop 사용
                    )}`}
                  >
                    {calculateHealthScore(log, dailyCalorieGoal)}
                    <span className="text-xs text-gray-600"> /10</span>
                  </p>
                </div>
                {/* 수정 버튼 */}
                {showEditButton && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <div
                        onClick={() => handleEdit(log)}
                        className="py-[2px] px-3 bg-gray-100 flex justify-center items-center gap-1 cursor-pointer rounded-lg hover:bg-gray-600 group"
                      >
                        <Pencil size={16} className="text-gray-400 group-hover:text-white" />
                        <p className="text-sm text-gray-400 group-hover:text-white">수정</p>
                      </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>음식 정보 수정</AlertDialogTitle>
                        <AlertDialogDescription>수정할 정보를 입력해주세요.</AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">음식 이름</label>
                          <Input
                            value={editingFood.food_name}
                            onChange={(e) =>
                              setEditingFood((prev) => ({
                                ...prev,
                                food_name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">칼로리 (kcal)</label>
                          <Input
                            type="number"
                            value={editingFood.calories || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : Number(e.target.value);
                              setEditingFood((prev) => ({
                                ...prev,
                                calories: value,
                              }));
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">단백질 (g)</label>
                            <Input
                              type="number"
                              value={editingFood.protein || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : Number(e.target.value);
                                setEditingFood((prev) => ({
                                  ...prev,
                                  protein: value,
                                }));
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">지방 (g)</label>
                            <Input
                              type="number"
                              value={editingFood.fat || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : Number(e.target.value);
                                setEditingFood((prev) => ({
                                  ...prev,
                                  fat: value,
                                }));
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">탄수화물 (g)</label>
                            <Input
                              type="number"
                              value={editingFood.carbs || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : Number(e.target.value);
                                setEditingFood((prev) => ({
                                  ...prev,
                                  carbs: value,
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <AlertDialogFooter className="flex gap-2">
                        <AlertDialogCancel>닫기</AlertDialogCancel>

                        {/* 삭제 확인을 위한 중첩 AlertDialog */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="bg-gray-400 h-10 p-6 rounded-md text-white">
                              삭제하기
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>음식 기록 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                {log.food_name}을(를) 삭제하시겠습니까?
                                <br />
                                삭제된 기록은 복구할 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>돌아가기</AlertDialogCancel>

                              <Button
                                onClick={() => handleDelete(log.id)}
                                className="bg-red-500 p-4 hover:bg-red-600"
                              >
                                삭제하기
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button onClick={() => handleUpdate(log.id)} className="bg-gray-800 p-6">
                          수정하기
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        ))}
        {foodLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">오늘 기록된 음식이 없습니다</div>
        )}
      </div>
    </Card>
  );
};

export default FoodLogCard;
