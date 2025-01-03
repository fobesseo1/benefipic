import { getUser } from '@/lib/supabse/server';
import FoodAnalyzer from './FoodAnalyzer';

export default async function Page() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;
  return (
    <div>
      <FoodAnalyzer currentUser_id={currentUser_id} />
    </div>
  );
}

//https://www.data.go.kr/data/15064775/openapi.do
