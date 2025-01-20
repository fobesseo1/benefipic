'use client';

import React, { useRef } from 'react';
import { Share2 } from 'lucide-react';
import { ExerciseLog } from '@/app/types/types';
import { toPng } from 'html-to-image';
import { FaWalking, FaRunning, FaSwimmer } from 'react-icons/fa';
import { GrYoga } from 'react-icons/gr';
import { Bike, Dumbbell, Mountain, Plus } from 'lucide-react';

interface ExerciseShareButtonProps {
  log: ExerciseLog;
}

const ExerciseShareButton = ({ log }: ExerciseShareButtonProps) => {
  const exerciseCardRef = useRef<HTMLDivElement>(null);

  const formatLogDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

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

  const handleShare = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!exerciseCardRef.current) return;

    try {
      const shareText = `운동: ${log.exercise_name}\n운동 시간: ${log.duration_minutes}분\n소모 칼로리: ${log.calories_burned}kcal`;

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

      const dataUrl = await toPng(exerciseCardRef.current, options);
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
            title: '오늘의 운동 기록',
            text: shareText,
            files: [
              new File([compressedBlob], 'exercise.jpg', {
                type: 'image/jpeg',
              }),
            ],
          });
        } catch (shareError) {
          console.log('Falling back to text-only share');
          await navigator.share({
            title: '오늘의 운동 기록',
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

  const IconComponent = getExerciseIcon(log.exercise_name);

  return (
    <>
      <div
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '512px', height: '512px' }}
      >
        <div ref={exerciseCardRef} className="relative w-full h-full bg-white">
          {log.image_url ? (
            <img
              src={log.image_url}
              alt={log.exercise_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center p-4">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  {IconComponent ? (
                    <IconComponent className="w-1/2 h-1/2 text-gray-400" />
                  ) : (
                    <span className="text-8xl font-semibold text-gray-400">
                      {log.exercise_name[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4">
            <p className="mb-1 text-lg font-bold text-white line-clamp-1 bg-gray-800/90 px-2 py-1 w-fit">
              {formatLogDate(log.logged_at)}
            </p>
            <h3 className="text-2xl font-bold text-white line-clamp-1 bg-gray-800/90 px-2 py-1 w-fit">
              {log.exercise_name}
            </h3>
            <div className="mt-2 tracking-tighter flex flex-col">
              <p className="text-lg text-white line-clamp-1 bg-gray-800/90 px-2 py-1 w-fit">
                운동시간: {log.duration_minutes}분
              </p>
              <p className="-mt-2 text-sm text-white bg-gray-800/90 px-2 py-1 w-fit">
                소모 칼로리: {log.calories_burned}kcal / from.BenefiPic
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

export default ExerciseShareButton;
