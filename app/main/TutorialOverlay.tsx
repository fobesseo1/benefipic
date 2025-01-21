// app/main/TutorialOverlay.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import createSupabaseBrowserClient from '@/lib/supabse/client';

interface TutorialOverlayProps {
  onComplete: () => void;
  user_id: string;
}

const tutorialImages = [
  '/tutorial/step1-0.webp',
  '/tutorial/step2-0.webp',
  '/tutorial/step3-0.webp',
  '/tutorial/step1-start.webp',
  '/tutorial/step1-1.webp',
  '/tutorial/step1-2.webp',
  '/tutorial/step1-3.webp',
  '/tutorial/step1-4.webp',
  '/tutorial/step1-5.webp',
  '/tutorial/step1-end.webp',
];

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete, user_id }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const updateTutorialStatus = async () => {
    const supabase = createSupabaseBrowserClient();

    try {
      const { error } = await supabase
        .from('health_records')
        .update({ tutorial_fin: true })
        .eq('user_id', user_id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update tutorial status:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < tutorialImages.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await updateTutorialStatus(); // DB 업데이트
    onComplete(); // 상태 업데이트
    window.location.href = '/food'; // 새로고침과 함께 페이지 이동
  };

  const isLastStep = currentStep === tutorialImages.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/90">
      <div className="w-full h-full flex flex-col items-center justify-center">
        {/* 컨텐츠 레이아웃 컨테이너 - 모바일 화면 비율 고려 */}
        <div className="w-full flex flex-col my-auto">
          {/* 상단 여백 및 건너뛰기 버튼 영역 */}
          <div className="h-[5vh] grid grid-cols-4 px-4">
            <div className="col-span-1"></div>
            <div className="col-span-2 text-white flex items-center justify-center border-y-2 border-gray-400">
              <p className="text-xl font-semibold">사용법 소개</p>
            </div>
            <div className="col-span-1 flex items-center justify-end">
              <button onClick={handleComplete} className="  text-white/50 text-sm  py-2 text-end">
                건너뛰기
              </button>
            </div>
          </div>

          {/* 이미지 표시 영역 */}
          <div className="h-[75vh] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                className="h-full"
                key={currentStep}
                initial={{ opacity: 0.1, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0.1, scale: 0.95, x: -20 }}
                transition={{
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={tutorialImages[currentStep]}
                    alt={`Tutorial step ${currentStep + 1}`}
                    className="max-h-full w-auto object-cover select-none"
                    draggable={false}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 하단 컨트롤 영역 */}
          <div className="h-[8vh] flex flex-col justify-center items-center gap-2">
            {/* 다음/시작하기 버튼 */}
            <button
              onClick={handleNext}
              className="bg-gray-600 text-white rounded-xl px-8 py-2 text-lg font-medium min-w-[160px]"
            >
              {isLastStep ? '시작하기' : '다음'}
            </button>

            {/* 진행 상태 표시 */}
            <div className="flex justify-center gap-2">
              {tutorialImages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
