// app/main/TutorialContainer.tsx
'use client';

import { useState } from 'react';
import TutorialOverlay from './TutorialOverlay';

interface TutorialContainerProps {
  isNewUser: boolean;
}

const TutorialContainer: React.FC<TutorialContainerProps> = ({ isNewUser }) => {
  const [showTutorial, setShowTutorial] = useState(isNewUser);

  if (!showTutorial) return null;

  return (
    <TutorialOverlay
      onComplete={() => {
        setShowTutorial(false);
        // 여기에 추가로 필요한 튜토리얼 완료 처리를 넣을 수 있습니다
      }}
    />
  );
};

export default TutorialContainer;
