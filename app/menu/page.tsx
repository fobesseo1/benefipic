import { getUser } from '@/lib/supabse/server';
import MenuAnalyzer from './MenuAnalyzer';

export default async function MenuPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;
  return (
    <div>
      <MenuAnalyzer currentUser_id={currentUser_id} />
    </div>
  );
}
