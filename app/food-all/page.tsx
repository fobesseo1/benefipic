import { Suspense } from 'react';
import FoodComponent from './FoodComponent';
import { getUser } from '@/lib/supabse/server';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';

export default async function FoodAllPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }
  return (
    <Suspense fallback={<div>Loading food logs...</div>}>
      <FoodComponent user_id={currentUser_id} />
    </Suspense>
  );
}
