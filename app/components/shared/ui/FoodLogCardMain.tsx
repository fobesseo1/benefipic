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
  EraserIcon,
  Flame,
  Pencil,
  Plus,
  Share,
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
import FoodShareButton from './FoodShareButton';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

export interface FoodLogCardProps {
  foodLogs: FoodLog[];
  dailyCalorieGoal: number;
  className?: string;
  onDelete?: (id: string) => Promise<void>;
  onUpdate?: (id: string, updatedData: Partial<FoodLog>) => Promise<void>;
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

export const FoodLogCardMain = ({
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
  const calculateHealthScore = (foodLog: FoodLog) => {
    let score = 5; // 기본 점수

    // 1. 칼로리 점수 (최대 2점 / 최소 -2점)
    const caloriesPerServing = foodLog.calories;
    if (caloriesPerServing < 300) score += 2;
    else if (caloriesPerServing < 500) score += 1;
    else if (caloriesPerServing > 1200) score -= 2;
    else if (caloriesPerServing > 800) score -= 1;

    // 2. 영양소 비율 점수
    const proteinRatio = (foodLog.protein * 4) / foodLog.calories;
    const fatRatio = (foodLog.fat * 9) / foodLog.calories;
    const carbRatio = (foodLog.carbs * 4) / foodLog.calories;

    // 단백질 점수 (최대 2점)
    if (proteinRatio > 0.25) score += 2;
    else if (proteinRatio > 0.15) score += 1;

    // 탄수화물 점수 (최대 1점)
    if (carbRatio >= 0.45 && carbRatio <= 0.65) score += 1;
    else if (carbRatio > 0.75) score -= 1;

    // 지방 점수 (최대 1점)
    if (fatRatio < 0.35) score += 1;
    else if (fatRatio > 0.5) score -= 1;

    const foodName = foodLog.food_name.toLowerCase();

    // 3. 최상급 건강식품 (단백질 위주의 고영양 식품) (+3점)
    if (
      foodName.includes('닭가슴살') ||
      foodName.includes('연어') ||
      foodName.includes('계란흰자') ||
      (foodName.includes('샐러드') && (foodName.includes('닭고기') || foodName.includes('연어'))) ||
      foodName.includes('단백질쉐이크') ||
      foodName.includes('프로틴')
    ) {
      score += 3;
    }

    // 4. 건강한 식품 (+2점)
    if (
      foodName.includes('두부') ||
      foodName.includes('계란') ||
      (foodName.includes('샐러드') && !foodName.includes('드레싱')) ||
      foodName.includes('현미') ||
      foodName.includes('잡곡') ||
      foodName.includes('오트밀') ||
      foodName.includes('고구마') ||
      foodName.includes('브로콜리') ||
      foodName.includes('콩') ||
      foodName.includes('견과류') ||
      foodName.includes('그릭요거트')
    ) {
      score += 2;
    }

    // 5. 괜찮은 식품 (+1점)
    if (
      foodName.includes('김치') ||
      foodName.includes('된장국') ||
      foodName.includes('미역국') ||
      foodName.includes('바나나') ||
      foodName.includes('사과') ||
      foodName.includes('배') ||
      foodName.includes('귤') ||
      foodName.includes('요거트') ||
      foodName.includes('닭안심')
    ) {
      score += 1;
    }

    // 6. 일반 식사류 (-1점)
    if (
      foodName.includes('김치찌개') ||
      foodName.includes('된장찌개') ||
      foodName.includes('제육볶음') ||
      foodName.includes('찜닭') ||
      foodName.includes('비빔밥') ||
      foodName.includes('불고기') ||
      foodName.includes('순두부찌개') ||
      foodName.includes('짜장면') ||
      foodName.includes('짬뽕') ||
      foodName.includes('볶음밥') ||
      foodName.includes('김밥') ||
      foodName.includes('덮밥')
    ) {
      score -= 1;
    }

    // 6. 국수,면 (-2점)
    if (
      foodName.includes('파스타') ||
      foodName.includes('국수') ||
      foodName.includes('면') ||
      foodName.includes('스파게티')
    ) {
      score -= 2;
    }

    // 7. 고칼로리/기름진 식사 (-2점)
    if (
      foodName.includes('돈까스') ||
      foodName.includes('탕수육') ||
      foodName.includes('동까스') ||
      foodName.includes('돈가스') ||
      foodName.includes('깐풍기') ||
      foodName.includes('튀김') ||
      foodName.includes('마라탕') ||
      foodName.includes('마라샹궈') ||
      foodName.includes('부대찌개') ||
      foodName.includes('라면') ||
      foodName.includes('우동')
    ) {
      score -= 2;
    }

    // 8. 패스트푸드 (-3점)
    if (
      foodName.includes('피자') ||
      foodName.includes('버거') ||
      foodName.includes('후라이드치킨') ||
      foodName.includes('양념치킨') ||
      foodName.includes('치킨') ||
      foodName.includes('맥도날드') ||
      foodName.includes('롯데리아') ||
      foodName.includes('버거킹') ||
      foodName.includes('KFC') ||
      foodName.includes('떡볶이')
    ) {
      score -= 3;
    }

    // 9. 디저트/간식류 (-2점)
    if (
      foodName.includes('케이크') ||
      foodName.includes('아이스크림') ||
      foodName.includes('과자') ||
      foodName.includes('쿠키') ||
      foodName.includes('초콜릿') ||
      foodName.includes('사탕') ||
      foodName.includes('젤리') ||
      foodName.includes('빵') ||
      foodName.includes('도넛') ||
      foodName.includes('타르트') ||
      foodName.includes('마카롱') ||
      foodName.includes('와플')
    ) {
      score -= 2;
    }

    // 10. 음료류
    // 매우 나쁜 음료 (-3점)
    if (
      foodName.includes('콜라') ||
      foodName.includes('사이다') ||
      foodName.includes('환타') ||
      foodName.includes('밀크쉐이크') ||
      foodName.includes('슬러시')
    ) {
      score -= 3;
    }
    // 나쁜 음료 (-2점)
    else if (
      foodName.includes('쥬스') ||
      foodName.includes('주스') ||
      (foodName.includes('스무디') && !foodName.includes('프로틴')) ||
      foodName.includes('에이드') ||
      foodName.includes('카페라떼') ||
      foodName.includes('카푸치노')
    ) {
      score -= 2;
    }
    // 적당한 음료 (-1점)
    else if (foodName.includes('커피') || foodName.includes('아메리카노')) {
      score -= 1;
    }
    // 좋은 음료 (+1점)
    else if (
      foodName.includes('물') ||
      foodName.includes('녹차') ||
      foodName.includes('보리차') ||
      foodName.includes('수박주스') ||
      foodName.includes('토마토주스') ||
      foodName.includes('식혜')
    ) {
      score += 1;
    }

    return Math.min(Math.max(1, score), 10);
  };
  // 아이템수 지정된 경우 화면이동 버튼 관련 함수
  const displayLogs = maxItems ? foodLogs.slice(0, maxItems) : foodLogs;
  const showPlusButton = maxItems === 3 && displayLogs.length === 3 && foodLogs.length > 3;

  return (
    <Card className={`p-4 pb-2  ${className}`}>
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
        {displayLogs.map((log) => (
          <SwiperSlide key={log.id} style={{ width: '60%' }}>
            <Card className="p-2">
              <div key={log.id} className="rounded-lg  bg-white">
                {/* 이미지 영역 */}
                <div className="relative w-full aspect-square">
                  {log.image_url ? (
                    <Image
                      src={log.image_url}
                      alt={log.food_name}
                      fill
                      sizes="100vw"
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 rounded-t-lg flex items-center justify-center p-4">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center px-2">
                        <p className="font-semibold line-clamp-2 text-lg tracking-tighter whitespace-pre-line">
                          {log.food_name.includes(' ')
                            ? `${log.food_name.split(' ')[0]}...`
                            : log.food_name}
                        </p>
                        {/* <UtensilsCrossed size={96} color="#9ca3af" /> */}
                      </div>
                    </div>
                  )}
                  {/* 헬스스코어 */}
                  <div className="absolute bottom-1 right-1 bg-white/80 rounded-lg px-1 py-[2px] border-2 border-gray-200">
                    <div className="flex items-center gap-1 tracking-tighter text-sm">
                      <div className="text-gray-600 flex items-center">
                        <ChefHat size={20} />
                        <span>:</span>
                      </div>
                      <p className={`font-bold text-xl text-rose-600`}>
                        {calculateHealthScore(log)}
                        <span className="text-xs text-gray-600"> /10</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 정보 영역 */}
                <div className="pt-4">
                  {/* 음식 이름과 시간 */}
                  <div className="grid grid-cols-4 items-end tracking-tighter border-b-[1px] border-gray-600">
                    <p className="col-span-3 font-bold text-gray-900 line-clamp-1">
                      {log.food_name}
                    </p>
                    <p className="col-span-1 text-sm text-gray-400 text-end">
                      {formatTime(log.logged_at)}
                    </p>
                  </div>

                  {/* 영양 정보 */}
                  <div className="mt-2">
                    <div className="flex items-center tracking-tighter gap-[2px] ">
                      <Flame size={16} className="text-rose-600" />
                      <div className="flex items-center gap-1">
                        <p className="text-rose-600 text-lg font-bold">
                          {log.calories}
                          <span className="text-rose-600 text-xs"> kcal</span>
                        </p>
                      </div>
                    </div>
                    {/* <div className="flex justify-between items-center tracking-tighter text-sm border-y-[1px] border-gray-200 ">
                    <div className="flex  items-center tracking-tighter gap-[2px]">
                      <Beef size={16} color="#4b5563" />
                      <div className="flex items-center gap-[2px]">
                        <p className="text-gray-600 text-lg font-bold">
                          {roundToInteger(log.protein)}
                          <span className="text-gray-600 text-xs"> g</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center tracking-tighter gap-[2px]">
                      <Droplet size={16} color="#4b5563" />
                      <div className="flex items-center gap-[2px]">
                        <p className="text-gray-600 font-bold text-lg">
                          {roundToInteger(log.fat)}
                          <span className="text-gray-600 text-xs"> g</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center tracking-tighter gap-[2px]">
                      <Wheat size={16} color="#4b5563" />
                      <div className="flex items-center gap-[2px]">
                        <p className="text-gray-600 font-bold text-lg">
                          {roundToInteger(log.carbs)}
                          <span className="text-gray-600 text-xs"> g</span>
                        </p>
                      </div>
                    </div>
                  </div> */}
                  </div>
                </div>
              </div>
            </Card>
          </SwiperSlide>
        ))}

        {/* 아이템수 제한시 하단 버튼 */}
        {/* {showPlusButton && (
          <div className="w-full h-12 rounded-lg flex items-center justify-center cursor-pointer ">
            <Link href="/food-all" className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600">
                <Plus size={24} className="text-gray-100" />
              </div>
              <p className="text-gray-600  font-medium">더보기</p>
            </Link>
          </div>
        )} */}
      </Swiper>

      {displayLogs.length === 0 && (
        <div className="col-span-2 text-center py-8 text-gray-500">오늘 기록된 음식이 없습니다</div>
      )}
    </Card>
  );
};

export default FoodLogCardMain;
