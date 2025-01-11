import { Suspense } from 'react';
import ExerciseComponent from './ExerciseComponent';
import { getUser } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';

export default async function ExerciseAllPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }
  return (
    <Suspense fallback={<div>Loading food logs...</div>}>
      <ExerciseComponent user_id={currentUser_id} />
    </Suspense>
  );
}
