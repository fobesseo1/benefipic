//app/main/page.tsx

import { Suspense } from 'react';
import MainComponent from './MainComponent';

export default function MainPage() {
  return (
    <Suspense>
      <MainComponent />
    </Suspense>
  );
}
