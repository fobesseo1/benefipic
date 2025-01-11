//app/weight-tracker/page.tsx

import { getUser } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';
import WeightTracker from './WeightTracker';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';

export default async function WeightTrackerPage() {
  const currentUser = await getUser();
    const currentUser_id = currentUser?.id;
  
    if (!currentUser) {
      return <NoLoginUserAlert />;
    }

  return (
    <div>
      <WeightTracker currentUser_id={currentUser_id} />
    </div>
  );
}
