import { Suspense } from 'react';
import FoodComponent from './FoodComponent';
import { getUser } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';

export default async function FoodAllPage() {
  const currentUser = await getUser();
  const user_id = currentUser?.id;

  if (!currentUser) {
    redirect('/auth');
  }
  return (
    <Suspense fallback={<div>Loading food logs...</div>}>
      <FoodComponent user_id={user_id} />
    </Suspense>
  );
}
