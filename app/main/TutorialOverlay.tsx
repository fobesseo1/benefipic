'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const tutorialImages = [
  '/tutorial/step1-0.png',
  '/tutorial/step2-0.png',
  '/tutorial/step3-0.png',
  '/tutorial/step4.png',
];

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < tutorialImages.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    onComplete();
    router.push('/analyze');
  };

  const isLastStep = currentStep === tutorialImages.length - 1;

  return (
    // 전체 오버레이 컨테이너
    <div className="fixed inset-0 z-50 bg-black/95">
      <div className="w-full h-full flex flex-col items-center justify-center">
        {/* 컨텐츠 레이아웃 컨테이너 - 모바일 화면 비율 고려 */}
        <div className="w-full  flex flex-col my-auto">
          {/* 상단 여백 및 건너뛰기 버튼 영역 (10vh) */}
          <div className="h-[5vh] relative">
            <button
              onClick={handleComplete}
              className="absolute top-6 right-6 text-white/80 text-base px-4 py-2"
            >
              건너뛰기
            </button>
          </div>

          {/* 이미지 표시 영역 (65vh) */}
          <div className="h-[65vh] relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={tutorialImages[currentStep]}
                    alt={`Tutorial step ${currentStep + 1}`}
                    className="w-full h-full object-contain select-none"
                    draggable={false}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 하단 컨트롤 영역 (25vh) */}
          <div className="h-[10vh] flex flex-col justify-center items-center gap-2 py-4">
            {/* 다음/시작하기 버튼 */}
            <button
              onClick={handleNext}
              className="bg-blue-500 text-white rounded-xl px-8 py-3.5 text-lg font-medium min-w-[160px]"
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
