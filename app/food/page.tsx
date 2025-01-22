//app/food/page.tsx

import { getUser } from '@/lib/supabse/server';
import FoodAnalyzer from './FoodAnalyzer';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';
import { isNewUser } from '@/utils/ad-utils';
import FoodAnalyzerGpt from './FoodAnalyzerGpt';

export default async function FoodPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  const newUserCheck = isNewUser(currentUser.created_at);
  //console.log(newUserCheck);

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  return (
    <div>
      <FoodAnalyzer currentUser_id={currentUser_id} newUserCheck={newUserCheck} />
      {/* <p className="text-red-600">gpt</p>
      <FoodAnalyzerGpt currentUser_id={currentUser_id} newUserCheck={newUserCheck} /> */}

      {/* <FoodAnalyzerNoFilter currentUser_id={currentUser_id} /> */}
    </div>
  );
}

//https://www.data.go.kr/data/15064775/openapi.do
