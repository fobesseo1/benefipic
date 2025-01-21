// app/main/TutorialContainer.tsx
'use client';

import { useState } from 'react';
import TutorialOverlay from './TutorialOverlay';

interface TutorialContainerProps {
  isNewUser: boolean;
  tutorialFinished: boolean;
  user_id: string;
}

const TutorialContainer: React.FC<TutorialContainerProps> = ({
  isNewUser,
  tutorialFinished,
  user_id,
}) => {
  const [showTutorial, setShowTutorial] = useState(isNewUser && !tutorialFinished);

  if (!showTutorial) return null;

  return (
    <TutorialOverlay
      user_id={user_id}
      onComplete={() => {
        setShowTutorial(false);
      }}
    />
  );
};

export default TutorialContainer;
