//app/weight-tracker/page.tsx

import { getUser } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';
import WeightTracker from './WeightTracker';

export default async function WeightTrackerPage() {
  const currentUser = await getUser();
  const user_id = currentUser?.id;

  if (!currentUser) {
    redirect('/auth');
  }

  return (
    <div>
      <WeightTracker />
    </div>
  );
}
