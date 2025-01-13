'use client';

import React, { useRef } from 'react';
import { Share2, UtensilsCrossed } from 'lucide-react';
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

  const handleShare = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!exerciseCardRef.current) return;

    try {
      const shareText = `운동: ${log.exercise_name}\n운동 시간: ${log.duration_minutes}분\n소모 칼로리: ${log.calories_burned}kcal`;

      const dataUrl = await toPng(exerciseCardRef.current, { backgroundColor: '#fff' });

      if (navigator.share) {
        try {
          await navigator.share({
            title: '오늘의 운동 기록',
            text: shareText,
            files: [
              new File([await fetch(dataUrl).then((r) => r.blob())], 'exercise.png', {
                type: 'image/png',
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

  const IconComponent = getExerciseIcon(log.exercise_name);

  return (
    <>
      {/* 이미지로 변환될 운동 카드 */}
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
        <div
          ref={exerciseCardRef}
          className="w-[480px] h-[480px] bg-white p-4 flex flex-col relative"
        >
          {/* 정사각형 이미지/아이콘 영역 */}
          <div className="w-full aspect-square bg-white">
            {log.image_url ? (
              <div className="w-full h-full relative">
                <img
                  src={log.image_url}
                  alt={log.exercise_name}
                  className="w-full h-full absolute inset-0 rounded-lg object-cover"
                  style={{ aspectRatio: '1/1' }}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
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
          </div>

          {/* 하단 텍스트 영역 */}
          <div className="absolute bottom-4 left-4 flex flex-col items-start justify-center">
            <p className="mb-1 text-lg font-bold text-white line-clamp-1 bg-gray-800/90 px-2 py-1 inline-block">
              {formatLogDate(log.logged_at)}
            </p>
            <h3 className="text-2xl font-bold text-white line-clamp-1 bg-gray-800/90 px-2 py-1 inline-block">
              {log.exercise_name}
            </h3>
            <div className="mt-2 tracking-tighter flex flex-col">
              <p className="text-lg text-white line-clamp-1 bg-gray-800/90 px-2 py-1 inline-block">
                운동시간: {log.duration_minutes}분
              </p>
              <p className="-mt-2 text-sm text-white bg-gray-800/90 px-2 py-1 inline-block">
                소모 칼로리: {log.calories_burned}kcal / from.BenefiPic
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 공유 버튼 */}
      <div
        onClick={handleShare}
        className="py-1 px-1 bg-gray-50 flex justify-center items-center cursor-pointer rounded-lg hover:bg-gray-600 group shadow-md gap-1"
      >
        <Share2 size={16} className="text-gray-400 group-hover:text-white" />
        <p className="text-sm text-gray-400 group-hover:text-white">공유</p>
      </div>
    </>
  );
};

export default ExerciseShareButton;
