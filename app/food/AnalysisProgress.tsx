'use client';

import React, { useEffect, useState } from 'react';
import { ImageDown, Brain, Calculator, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressStepProps {
  icon: LucideIcon;
  text: string;
}

type StepKey = 'compress' | 'analyzing' | 'calculate';

interface StepInfo {
  icon: LucideIcon;
  text: string;
}

interface AnalysisProgressProps {
  currentStep: StepKey;
}

const ProgressStep: React.FC<ProgressStepProps> = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center gap-4">
    <div className="p-3 rounded-full bg-blue-100 animate-pulse">
      <Icon size={32} className="text-blue-600" />
    </div>
    <p className="font-medium text-blue-600 text-lg">{text}</p>
  </div>
);

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ currentStep }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showLongProcessMessage, setShowLongProcessMessage] = useState(false);

  const analyzingMessages = [
    '음식을 분석하고 있어요...',
    '재료를 확인하고 있어요...',
    '영양소를 파악하고 있어요...',
  ];

  const steps: Record<StepKey, StepInfo> = {
    compress: { icon: ImageDown, text: '이미지를 최적화하고 있어요' },
    analyzing: { icon: Brain, text: analyzingMessages[messageIndex] },
    calculate: { icon: Calculator, text: '영양소를 계산하고 있어요' },
  };

  // 컴포넌트가 마운트될 때마다 상태 초기화
  useEffect(() => {
    setMessageIndex(0);
    setShowLongProcessMessage(false);
    return () => {
      setMessageIndex(0);
      setShowLongProcessMessage(false);
    };
  }, []); // 컴포넌트 마운트/언마운트 시

  // currentStep이 변경될 때마다 상태 초기화
  useEffect(() => {
    setMessageIndex(0);
    setShowLongProcessMessage(false);
  }, [currentStep]);

  // analyzing 단계일 때만 메시지 순환 및 타이머 설정
  useEffect(() => {
    let messageInterval: NodeJS.Timeout | null = null;
    let longProcessTimer: NodeJS.Timeout | null = null;

    if (currentStep === 'analyzing') {
      messageInterval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % analyzingMessages.length);
      }, 1500);

      longProcessTimer = setTimeout(() => {
        setShowLongProcessMessage(true);
      }, 5000);
    }

    return () => {
      if (messageInterval) clearInterval(messageInterval);
      if (longProcessTimer) clearTimeout(longProcessTimer);
    };
  }, [currentStep]);

  const currentStepInfo = steps[currentStep];
  if (!currentStepInfo) return null;

  if (currentStep === 'analyzing') {
    return (
      <div className="relative w-full max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            className="absolute w-full h-1 bg-blue-400/30"
            animate={{
              top: ['0%', '100%'],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          <motion.div
            key={`${currentStep}-${messageIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ProgressStep icon={currentStepInfo.icon} text={currentStepInfo.text} />
            <AnimatePresence>
              {showLongProcessMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-gray-500 mt-2 text-center whitespace-pre-line"
                >
                  <p>{`음식이나 주변 물건들이 많이 보여\n시간이 좀 더 필요해요😂`}</p>
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return <ProgressStep icon={currentStepInfo.icon} text={currentStepInfo.text} />;
};

export default AnalysisProgress;
