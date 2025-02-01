//app/weight-tracker/page.tsx

import { getUser } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';
import WeightTracker from './WeightTracker';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';
import { ChevronLeft } from 'lucide-react';
import TopNavigation from './../TopNavigation';

export default async function WeightTrackerPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }
  const topNavigationTitle = '체중';
  return (
    <div>
      <TopNavigation topNavigationTitle={topNavigationTitle} />
      <WeightTracker currentUser_id={currentUser_id} />
    </div>
  );
}
