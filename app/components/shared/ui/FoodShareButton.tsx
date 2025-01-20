'use client';

import React, { useRef } from 'react';
import { Share2 } from 'lucide-react';
import { FoodLog } from '@/app/types/types';
import { toPng } from 'html-to-image';

interface FoodShareButtonProps {
  log: FoodLog;
}

const FoodShareButton = ({ log }: FoodShareButtonProps) => {
  const foodCardRef = useRef<HTMLDivElement>(null);

  const formatLogDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const handleShare = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!foodCardRef.current) return;

    try {
      const shareText = `음식: ${log.food_name}\n칼로리: ${log.calories}kcal\n단백질: ${log.protein}g\n지방: ${log.fat}g\n탄수화물: ${log.carbs}g`;

      const options = {
        quality: 0.95,
        backgroundColor: '#fff',
        width: 512,
        height: 512,
        pixelRatio: 2,
        skipAutoScale: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      };

      const dataUrl = await toPng(foodCardRef.current, options);
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const compressedBlob = await new Promise<Blob>((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          canvas.width = 512;
          canvas.height = 512;
          ctx?.drawImage(img, 0, 0, 512, 512);

          canvas.toBlob(
            (resultBlob) => {
              resolve(resultBlob!);
            },
            'image/jpeg',
            0.85
          );
        };

        img.src = dataUrl;
      });

      if (navigator.share) {
        try {
          await navigator.share({
            title: '오늘의 음식 기록',
            text: shareText,
            files: [
              new File([compressedBlob], 'food.jpg', {
                type: 'image/jpeg',
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

  return (
    <>
      <div
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '512px', height: '512px' }}
      >
        <div ref={foodCardRef} className="relative w-full h-full bg-white">
          {log.image_url ? (
            <img src={log.image_url} alt={log.food_name} className="w-full h-full object-cover " />
          ) : (
            <div className="w-full h-full bg-gray-100  flex items-center justify-center">
              <p className="text-2xl font-bold text-gray-400">{log.food_name}</p>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4">
            {' '}
            {/* right-4 추가 */}
            <p className="mb-1 text-lg font-bold text-white line-clamp-1 bg-gray-800/90 px-2 py-1 w-fit">
              {formatLogDate(log.logged_at)}
            </p>
            <h3 className="text-2xl font-bold text-white line-clamp-1 bg-gray-800/90 px-2 py-1 w-fit">
              {log.food_name}
            </h3>
            <div className="mt-2 tracking-tighter flex flex-col">
              <p className="text-lg text-white line-clamp-1 bg-gray-800/90 px-2 py-1 w-fit">
                칼로리: {log.calories}kcal
              </p>
              <p className="-mt-2 text-sm text-white bg-gray-800/90 px-2 py-1 w-fit">
                단백질: {Math.round(log.protein)}g, 지방: {Math.round(log.fat)}g, 탄수화물:
                {Math.round(log.carbs)}g / from.BenefiPic
              </p>
            </div>
          </div>
        </div>
      </div>

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
