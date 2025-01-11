import { getUser } from '@/lib/supabse/server';
import MenuAnalyzer from './MenuAnalyzer';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';

export default async function MenuPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }
  return (
    <div>
      <MenuAnalyzer currentUser_id={currentUser_id} />
    </div>
  );
}
