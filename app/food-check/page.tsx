import { getUser } from '@/lib/supabse/server';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';
import FoodCheckAnalyzer from './FoodCheckAnalyzer';
import { isNewUser } from '@/utils/ad-utils';

export default async function FoodCheckPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  const newUserCheck = isNewUser(currentUser.created_at);

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  return (
    <div>
      <FoodCheckAnalyzer currentUser_id={currentUser_id} newUserCheck={newUserCheck} />
      {/* <FoodAnalyzerNoFilter currentUser_id={currentUser_id} /> */}
    </div>
  );
}

//https://www.data.go.kr/data/15064775/openapi.do
