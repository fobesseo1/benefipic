import { getUser } from '@/lib/supabse/server';
import MenuAnalyzer from './MenuAnalyzer';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';
import { isNewUser } from '@/utils/ad-utils';

export default async function MenuPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  const newUserCheck = isNewUser(currentUser.created_at);

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }
  return (
    <div>
      <MenuAnalyzer currentUser_id={currentUser_id} newUserCheck={newUserCheck} />
    </div>
  );
}
