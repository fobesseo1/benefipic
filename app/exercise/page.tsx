import { getUser } from '@/lib/supabse/server';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';
import ExerciseAnalyzer from './ExerciseAnalyzer';

export default async function FoodPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  return (
    <div>
      <ExerciseAnalyzer currentUser_id={currentUser_id} />
    </div>
  );
}
