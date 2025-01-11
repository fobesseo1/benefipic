//app/food-description/page.tsx

import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';
import FoodDescription from './Description';
import { getUser } from '@/lib/supabse/server';

export default async function FoodDescriptionPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  return (
    <div>
      <FoodDescription currentUser_id={currentUser_id} />
    </div>
  );
}
