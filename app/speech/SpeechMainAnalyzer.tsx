'use client';

import React, { useState } from 'react';
import { Mic, ChevronUp, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import SpeechAnalyzerFood from '../speech/SpeechAnalyzerFood';
import SpeechAnalyzerFoodCheck from '../speech/SpeechAnalyzerFoodCheck';
import SpeechAnalyzerMenu from '../speech/SpeechAnalyzerMenu';
import SpeechAnalyzerExercise from '../speech/SpeechAnalyzerExercise';

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
}

export const SpeechMainAnalyzer = ({ user_id, newUserCheck, onDataUpdate }: MainAnalyzerProps) => {
  const [showTrigger, setShowTrigger] = useState(true);
  const [currentAnalyzer, setCurrentAnalyzer] = useState<'food' | 'check' | 'menu' | 'exercise'>(
    'food'
  );

  const handleAnalyzerSelect = (type: 'food' | 'check' | 'menu' | 'exercise') => {
    setCurrentAnalyzer(type);
  };

  const handleTriggerClick = () => {
    setShowTrigger(false);
  };

  const handleToggle = () => {
    setShowTrigger(!showTrigger);
  };

  return (
    <>
      {showTrigger ? (
        <Card className="p-4 flex flex-col gap-2">
          <TriggerComponent onClick={handleTriggerClick} />
        </Card>
      ) : (
        <Card className="p-4 flex flex-col gap-1">
          {/* <hr className="my-2" /> */}
          {currentAnalyzer === 'food' && (
            <SpeechAnalyzerFood
              currentUser_id={user_id}
              newUserCheck={newUserCheck}
              onDataUpdate={onDataUpdate}
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
