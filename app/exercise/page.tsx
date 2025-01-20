import { getUser } from '@/lib/supabse/server';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';
import ExerciseAnalyzer from './ExerciseAnalyzer';
import { isNewUser } from '@/utils/ad-utils';

export default async function FoodPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  const newUserCheck = isNewUser(currentUser.created_at);

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  return (
    <div>
      <ExerciseAnalyzer currentUser_id={currentUser_id} newUserCheck={newUserCheck} />
    </div>
  );
}
