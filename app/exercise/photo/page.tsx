import NoLoginUserAlert from '@/app/components/shared/ui/NoLoginUserAlert';
import { getUser } from '@/lib/supabse/server';
import { isNewUser } from '@/utils/ad-utils';
import ExerciseAnalyzer from '../ExerciseAnalyzer';

export default async function ExercisePhoto() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  const newUserCheck = isNewUser(currentUser.created_at);
  //console.log(newUserCheck);

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  return (
    <div className="pb-16 relative">
      <ExerciseAnalyzer currentUser_id={currentUser_id} newUserCheck={newUserCheck} />
    </div>
  );
}
