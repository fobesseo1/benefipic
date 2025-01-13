// app/exercise/page.tsx

import { getUser } from '@/lib/supabse/server';
import ExerciseDescription from './ExerciseDescription';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';

export default async function ExercisePage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }
  return (
    <div>
      <ExerciseDescription currentUser_id={currentUser_id} />
    </div>
  );
}
