import { getUser } from '@/lib/supabse/server';
import { isNewUser } from '@/utils/ad-utils';
import TopNavigation from '@/app/TopNavigation';
import NoLoginUserAlert from '@/app/components/shared/ui/NoLoginUserAlert';
import CheckWrapper from './CheckWrapper';

export default async function FoodPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  const newUserCheck = isNewUser(currentUser.created_at);
  const topNavigationTitle = '먹을까? 말까?';

  return (
    <div className="w-full max-w-xl flex flex-col gap-6">
      <TopNavigation topNavigationTitle={topNavigationTitle} />
      <CheckWrapper currentUser_id={currentUser_id} newUserCheck={newUserCheck} />
    </div>
  );
}
