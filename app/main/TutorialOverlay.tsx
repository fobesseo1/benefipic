'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import createSupabaseBrowserClient from '@/lib/supabse/client';

interface TutorialOverlayProps {
  onComplete: () => void;
  user_id: string;
}

const tutorialImages = [
  '/tutorial/step1-0.webp',

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
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const router = useRouter();

  // 이미지 프리로딩
  useEffect(() => {
    tutorialImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentStep < tutorialImages.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
    if (isRightSwipe && currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

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
    await updateTutorialStatus();
    onComplete();
    window.location.href = '/food/input';
  };

  const isLastStep = currentStep === tutorialImages.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/90">
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="w-full flex flex-col my-auto">
          {/* 상단 여백 및 건너뛰기 버튼 영역 */}
          <div className="h-[5vh] grid grid-cols-4 px-4">
            <div className="col-span-1"></div>
            <div className="col-span-2 text-white flex items-center justify-center border-y-2 border-gray-400">
              <p className="text-xl font-semibold">사용법 소개</p>
            </div>
            <div className="col-span-1 flex items-center justify-end">
              <button onClick={handleComplete} className="text-white/50 text-sm py-2 text-end">
                건너뛰기
              </button>
            </div>
          </div>

          {/* 이미지 표시 영역 */}
          <div
            className="h-[75vh] flex items-center justify-center touch-pan-x"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                className="h-full"
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{
                  duration: 0.15,
                  ease: 'easeOut',
                }}
              >
                <div className="w-full h-full flex items-center justify-center p-4 relative">
                  <img
                    src={tutorialImages[currentStep]}
                    alt={`Tutorial step ${currentStep + 1}`}
                    className="max-h-full w-auto object-cover select-none"
                    draggable={false}
                  />
                  {currentStep < tutorialImages.length - 1 && (
                    <img src={tutorialImages[currentStep + 1]} alt="preload" className="hidden" />
                  )}
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
