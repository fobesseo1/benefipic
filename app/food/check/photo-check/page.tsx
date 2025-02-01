import NoLoginUserAlert from '@/app/components/shared/ui/NoLoginUserAlert';
import { getUser } from '@/lib/supabse/server';
import { isNewUser } from '@/utils/ad-utils';
import FoodAnalyzer from '../../FoodAnalyzer';
import FoodCheckAnalyzer from '@/app/food-check/FoodCheckAnalyzer';

export default async function FoodPhotoCheck() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  const newUserCheck = isNewUser(currentUser.created_at);
  //console.log(newUserCheck);

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  return (
    <div className="pb-16 relative">
      <FoodCheckAnalyzer currentUser_id={currentUser_id} newUserCheck={newUserCheck} />
    </div>
  );
}
