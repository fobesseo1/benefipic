import { Suspense } from 'react';
import FoodComponent from './FoodComponent';

export default function FoodAllPage() {
  return (
    <Suspense fallback={<div>Loading food logs...</div>}>
      <FoodComponent />
    </Suspense>
  );
}
