import { getUser } from '@/lib/supabse/server';
import FoodAnalyzer from './FoodAnalyzer';
import FoodAnalyzerNoFilter from './FoodAnalyzerNoFilter';

export default async function FoodPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;
  return (
    <div>
      <FoodAnalyzer currentUser_id={currentUser_id} />
      {/* <FoodAnalyzerNoFilter currentUser_id={currentUser_id} /> */}
    </div>
  );
}

//https://www.data.go.kr/data/15064775/openapi.do
