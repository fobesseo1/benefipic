'use client';

import React, { useRef } from 'react';
import { Share } from 'lucide-react';
import domtoimage from 'dom-to-image';
import { FaWalking, FaRunning, FaSwimmer } from 'react-icons/fa';
import { GrYoga } from 'react-icons/gr';
import { Bike, Dumbbell, Mountain, Plus } from 'lucide-react';
import { ExerciseLog } from '@/app/types/types';

interface ExerciseShareButtonProps {
  log: ExerciseLog;
}

const ExerciseShareButton = ({ log }: ExerciseShareButtonProps) => {
  const exerciseCardRef = useRef<HTMLDivElement>(null);

  const handleShare = async (event: React.MouseEvent) => {
    // 이벤트 전파 중단
    event.stopPropagation();
    if (!exerciseCardRef.current) return;

    try {
      // 먼저 공유할 텍스트 준비
      const shareText = `운동: ${log.exercise_name}\n운동 시간: ${log.duration_minutes}분\n소모 칼로리: ${log.calories_burned}kcal`;

      // 이미지 생성
      const dataUrl = await domtoimage.toPng(exerciseCardRef.current, {
        quality: 1.0,
        bgcolor: '#fff',
        style: {
          transform: 'none',
        },
      });

      if (navigator.share) {
        // 모바일 환경에서는 공유 API 사용
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
          // 파일 공유가 실패하면 텍스트만 공유
          console.log('Falling back to text-only share');
          await navigator.share({
            title: '오늘의 운동 기록',
            text: shareText,
          });
        }
      } else {
        // 데스크톱 환경에서는 클립보드에 복사
        await navigator.clipboard.writeText(shareText);
        alert('텍스트가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('공유하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
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
    return iconMap[exerciseName as keyof typeof iconMap] || null;
  };

  const IconComponent = getExerciseIcon(log.exercise_name);

  return (
    <>
      {/* 이미지로 변환될 운동 카드 - position fixed로 변경 */}
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
        <div ref={exerciseCardRef} className="w-[300px] bg-white p-4">
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
          <div className="mt-4">
            <h3 className="font-bold text-lg">{log.exercise_name}</h3>
            <p className="text-gray-600">운동 시간: {log.duration_minutes}분</p>
            <p className="text-gray-600">소모 칼로리: {log.calories_burned}kcal</p>
          </div>
        </div>
      </div>

      {/* 공유 버튼 */}
      <button
        type="button"
        onClick={handleShare}
        className="py-1 px-1 bg-gray-50 flex justify-center items-center cursor-pointer rounded-lg hover:bg-gray-600 group"
      >
        <Share size={16} className="text-gray-400 group-hover:text-white" />
        <p className="text-sm text-gray-400 group-hover:text-white">공유</p>
      </button>
    </>
  );
};

export default ExerciseShareButton;
