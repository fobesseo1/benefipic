'use client';

import React from 'react';
import { ImageDown, Brain, Calculator, LucideIcon } from 'lucide-react';

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
  const steps: Record<StepKey, StepInfo> = {
    compress: { icon: ImageDown, text: '이미지를 최적화하고 있어요' },
    analyzing: { icon: Brain, text: '음식을 분석하고 있어요' },
    calculate: { icon: Calculator, text: '영양소를 계산하고 있어요' },
  };

  const currentStepInfo = steps[currentStep];

  if (!currentStepInfo) return null;

  return <ProgressStep icon={currentStepInfo.icon} text={currentStepInfo.text} />;
};

export default AnalysisProgress;
