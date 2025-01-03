import { Suspense } from 'react';
import ExerciseComponent from './ExerciseComponent';

export default function ExerciseAllPage() {
  return (
    <Suspense fallback={<div>Loading food logs...</div>}>
      <ExerciseComponent />
    </Suspense>
  );
}
