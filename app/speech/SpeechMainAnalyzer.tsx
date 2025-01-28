'use client';

import React, { useState, useEffect } from 'react';
import { Mic, ChevronUp, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import SpeechAnalyzerFood from '../speech/SpeechAnalyzerFood';
import SpeechAnalyzerFoodCheck from '../speech/SpeechAnalyzerFoodCheck';
import SpeechAnalyzerMenu from '../speech/SpeechAnalyzerMenu';
import SpeechAnalyzerExercise from '../speech/SpeechAnalyzerExercise';
import { useSpeechStore } from '@/app/store/speechStore';

// 트리거 컴포넌트
const TriggerComponent = ({ onClick }: { onClick: () => void }) => (
  <div
    onClick={onClick}
    className="flex items-center rounded-2xl shadow-sm border px-4 py-4 bg-black cursor-pointer transition-all hover:bg-gray-900"
  >
    <div className="rounded-full w-12 h-12 bg-gray-50 shadow-md flex items-center justify-center">
      <Mic className="h-6 w-6 text-gray-600" />
    </div>
    <input
      value="음성 또는 텍스트 입력..."
      className="flex-1 border-0 bg-transparent p-2 tracking-tighter text-white cursor-pointer"
      readOnly
    />
  </div>
);

// 메뉴 버튼 컴포넌트
const MenuButtons = ({
  onSelect,
  currentAnalyzer,
}: {
  onSelect: (type: 'food' | 'check' | 'menu' | 'exercise') => void;
  currentAnalyzer: string;
}) => (
  <div className="w-full h-24 grid grid-cols-2 gap-2 tracking-tighter font-semibold animate-slide-up mb-2">
    <button
      onClick={() => onSelect('food')}
      className={`border-gray-200 border-2 flex items-center justify-center gap-2 col-span-1 rounded-xl transition-colors
        ${currentAnalyzer === 'food' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
    >
      🥄 식사 기록
    </button>
    <button
      onClick={() => onSelect('check')}
      className={`border-gray-200 border-2 flex items-center justify-center gap-2 col-span-1 rounded-xl transition-colors
        ${currentAnalyzer === 'check' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
    >
      🤔 먹을까? 말까?
    </button>
    <button
      onClick={() => onSelect('menu')}
      className={`border-gray-200 border-2 flex items-center justify-center gap-2 col-span-1 rounded-xl transition-colors
        ${currentAnalyzer === 'menu' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
    >
      🍽️ 메뉴 추천
    </button>
    <button
      onClick={() => onSelect('exercise')}
      className={`border-gray-200 border-2 flex items-center justify-center gap-2 col-span-1 rounded-xl transition-colors
        ${currentAnalyzer === 'exercise' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
    >
      💪 운동 기록
    </button>
  </div>
);

// 토글 버튼 컴포넌트
const ToggleButton = ({ onClick, isExpanded }: { onClick: () => void; isExpanded: boolean }) => (
  <button
    onClick={onClick}
    className="w-full flex justify-center items-center  hover:bg-gray-100 transition-colors rounded-md"
  >
    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
  </button>
);

// 메인 컴포넌트
interface MainAnalyzerProps {
  user_id: string;
  newUserCheck: boolean;
  onDataUpdate: () => void;
  totalDailyCalories?: number;
}

// 깜빡
const blinkStyle = `
  @keyframes borderBlink {
    0% {
      box-shadow: 0 0 0 0 rgba(156, 163, 175, 0.4);
      border-color: rgb(156, 163, 175);
      background-image: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);
    }
    35% {
      box-shadow: 0 0 0 5px rgba(209, 213, 219, 0.2);
      border-color: rgb(190, 195, 200);
      background-image: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(209, 213, 219, 0);
      border-color: rgb(209, 213, 219);
      background-image: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);
    }
    85% {
      box-shadow: 0 0 0 5px rgba(209, 213, 219, 0.2);
      border-color: rgb(190, 195, 200);
      background-image: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);
    }
    95% {
      box-shadow: 0 0 0 2px rgba(156, 163, 175, 0.2);
      border-color: rgb(170, 175, 180);
      background-image: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(156, 163, 175, 0.4);
      border-color: rgb(156, 163, 175);
      background-image: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);
    }
  }

  .border-blink {
    border-width: 4px;
    animation: borderBlink 3s ease-in-out infinite;
  }
`;

export const SpeechMainAnalyzer = ({
  user_id,
  newUserCheck,
  onDataUpdate,
  totalDailyCalories,
}: MainAnalyzerProps) => {
  const { showSpeechAnalyzer, highlightSpeechAnalyzer, setSpeechAnalyzer, resetSpeechAnalyzer } =
    useSpeechStore();
  const [showTrigger, setShowTrigger] = useState(true);
  const [currentAnalyzer, setCurrentAnalyzer] = useState<'food' | 'check' | 'menu' | 'exercise'>(
    'food'
  );

  // showSpeechAnalyzer 상태가 변경될 때 showTrigger 업데이트
  useEffect(() => {
    if (showSpeechAnalyzer) {
      setShowTrigger(false);
    }
  }, [showSpeechAnalyzer]);

  // highlightSpeechAnalyzer가 true일 때 3초 후 false로 변경
  useEffect(() => {
    if (highlightSpeechAnalyzer) {
      const timer = setTimeout(() => {
        setSpeechAnalyzer(showSpeechAnalyzer, false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightSpeechAnalyzer, showSpeechAnalyzer, setSpeechAnalyzer]);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = blinkStyle;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // 카드의 className을 동적으로 설정
  const cardClassName = `p-4 flex flex-col gap-1 border-[1px] ${
    highlightSpeechAnalyzer ? 'border-blink' : ''
  }`;

  const handleAnalyzerSelect = (type: 'food' | 'check' | 'menu' | 'exercise') => {
    setCurrentAnalyzer(type);
  };

  const handleTriggerClick = () => {
    setShowTrigger(false);
  };

  const handleToggle = () => {
    setShowTrigger(!showTrigger);
    resetSpeechAnalyzer();
  };

  return (
    <>
      {showTrigger ? (
        <Card className="p-4 flex flex-col gap-2">
          <TriggerComponent onClick={handleTriggerClick} />
        </Card>
      ) : (
        <Card className={cardClassName}>
          {/* <hr className="my-2" /> */}
          {currentAnalyzer === 'food' && (
            <SpeechAnalyzerFood
              currentUser_id={user_id}
              newUserCheck={newUserCheck}
              onDataUpdate={onDataUpdate}
              totalDailyCalories={totalDailyCalories}
            />
          )}
          {currentAnalyzer === 'check' && (
            <SpeechAnalyzerFoodCheck
              currentUser_id={user_id}
              newUserCheck={newUserCheck}
              onDataUpdate={onDataUpdate}
            />
          )}
          {currentAnalyzer === 'menu' && (
            <SpeechAnalyzerMenu
              currentUser_id={user_id}
              newUserCheck={newUserCheck}
              onDataUpdate={onDataUpdate}
            />
          )}
          {currentAnalyzer === 'exercise' && (
            <SpeechAnalyzerExercise
              currentUser_id={user_id}
              newUserCheck={newUserCheck}
              onDataUpdate={onDataUpdate}
            />
          )}
          <ToggleButton onClick={handleToggle} isExpanded={!showTrigger} />
          <MenuButtons onSelect={handleAnalyzerSelect} currentAnalyzer={currentAnalyzer} />
        </Card>
      )}
    </>
  );
};

export default SpeechMainAnalyzer;
