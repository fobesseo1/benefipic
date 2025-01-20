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
    '메뉴를 분석하고 있어요...',
    '영양 정보를 확인하고 있어요...',
    '건강 정보를 분석하고 있어요...',
  ];

  const steps: Record<StepKey, StepInfo> = {
    compress: { icon: ImageDown, text: '이미지를 최적화하고 있어요' },
    analyzing: { icon: Brain, text: analyzingMessages[messageIndex] },
    calculate: { icon: Calculator, text: '영양소를 계산하고 있어요' },
  };

  useEffect(() => {
    setMessageIndex(0);
    setShowLongProcessMessage(false);
    return () => {
      setMessageIndex(0);
      setShowLongProcessMessage(false);
    };
  }, []);

  useEffect(() => {
    setMessageIndex(0);
    setShowLongProcessMessage(false);
  }, [currentStep]);

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
                  {currentStep === 'analyzing' ? (
                    <p>{`메뉴가 복잡하거나 여러 음식이 있어\n시간이 좀 더 필요해요😊`}</p>
                  ) : (
                    <p>{`더 건강한 메뉴나 제품을 찾고 있어요\n조금만 기다려주세요🥗`}</p>
                  )}
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
