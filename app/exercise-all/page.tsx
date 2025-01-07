import { Suspense } from 'react';
import ExerciseComponent from './ExerciseComponent';
import { getUser } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';

export default async function ExerciseAllPage() {
  const currentUser = await getUser();
  const user_id = currentUser?.id;

  if (!currentUser) {
    redirect('/auth');
  }
  return (
    <Suspense fallback={<div>Loading food logs...</div>}>
      <ExerciseComponent user_id={user_id} />
    </Suspense>
  );
}
