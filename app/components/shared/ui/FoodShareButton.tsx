'use client';

import React, { useRef } from 'react';
import { Share, Share2, UtensilsCrossed } from 'lucide-react';
import domtoimage from 'dom-to-image';
import { FoodLog } from '@/app/types/types';

interface FoodShareButtonProps {
  log: FoodLog;
}

const FoodShareButton = ({ log }: FoodShareButtonProps) => {
  const foodCardRef = useRef<HTMLDivElement>(null);

  const handleShare = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!foodCardRef.current) return;

    try {
      const shareText = `음식: ${log.food_name}\n칼로리: ${log.calories}kcal\n단백질: ${log.protein}g\n지방: ${log.fat}g\n탄수화물: ${log.carbs}g`;

      const dataUrl = await domtoimage.toPng(foodCardRef.current, {
        quality: 1.0,
        bgcolor: '#fff',
        style: {
          transform: 'none',
        },
      });

      if (navigator.share) {
        try {
          await navigator.share({
            title: '오늘의 음식 기록',
            text: shareText,
            files: [
              new File([await fetch(dataUrl).then((r) => r.blob())], 'food.png', {
                type: 'image/png',
              }),
            ],
          });
        } catch (shareError) {
          console.log('Falling back to text-only share');
          await navigator.share({
            title: '오늘의 음식 기록',
            text: shareText,
          });
        }
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('텍스트가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('공유하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const formatLogDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  return (
    <>
      {/* 이미지로 변환될 음식 카드 */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          zIndex: -1,
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <div ref={foodCardRef} className="w-[480px] h-[480px] bg-white p-4 flex flex-col relative">
          {/* 정사각형 이미지/아이콘 영역 */}
          <div className="w-full aspect-square">
            {log.image_url ? (
              <div className="relative w-full h-full">
                {/* Next.js Image 컴포넌트 대신 일반 img 태그 사용 */}
                <img
                  src={log.image_url}
                  alt={log.food_name}
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center p-4">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <p className="text-center font-semibold line-clamp-1 text-6xl">
                      {log.food_name.slice(0, 6)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 하단 텍스트 영역 */}
          <div className="absolute bottom-6 left-6 flex flex-col items-start justify-center">
            <p className="mb-1 text-xl font-bold text-white line-clamp-1 bg-gray-800 p-1">
              {formatLogDate(log.logged_at)}
            </p>
            <h3 className="text-3xl font-bold text-white line-clamp-1 bg-gray-800 p-1">
              {log.food_name}
            </h3>
            <div className="mt-2 tracking-tighter">
              <p className=" text-xl text-white line-clamp-1 bg-gray-800 px-1">
                칼로리: {log.calories}kcal
              </p>
              <p className="text-lg text-white line-clamp-1 bg-gray-800 px-1">
                단백질: {Math.round(log.protein)}g | 지방: {Math.round(log.fat)}g | 탄수화물:
                {Math.round(log.carbs)}g
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 공유 버튼 */}

      <button
        type="button"
        onClick={handleShare}
        className="py-2 px-1 bg-gray-100 flex justify-center items-center cursor-pointer rounded-lg hover:bg-gray-600 group gap-2 shadow-md"
      >
        <Share2 size={16} className="text-gray-600 group-hover:text-white" />
        <p className="text-sm text-gray-600 group-hover:text-white">공유</p>
      </button>
    </>
  );
};

export default FoodShareButton;
