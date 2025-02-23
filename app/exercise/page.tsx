import { getUser } from '@/lib/supabse/server';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';
import ExerciseAnalyzer from './ExerciseAnalyzer';
import { isNewUser } from '@/utils/ad-utils';
import TopNavigation from '../TopNavigation';
import ExerciseWrapper from './ExerciseWrapper';

export default async function FoodPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  const newUserCheck = isNewUser(currentUser.created_at);

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  const topNavigationTitle = '운동 기록';

  return (
    <div className="w-full max-w-xl flex flex-col gap-6">
      <TopNavigation topNavigationTitle={topNavigationTitle} />
      <ExerciseWrapper currentUser_id={currentUser_id} newUserCheck={newUserCheck} />
    </div>
  );
}
