// app/speech/page.tsx
import { getUser } from '@/lib/supabse/server';
import SpeechAnalyzerFood from './SpeechAnalyzerFood';
import SpeechToText from './SpeechToText';
import { isNewUser } from '@/utils/ad-utils';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';

export default async function SpeechFoodPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  const newUserCheck = isNewUser(currentUser.created_at);
  //console.log(newUserCheck);

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }
  return (
    <main className="container mx-auto py-8">
      <SpeechAnalyzerFood currentUser_id={currentUser_id} newUserCheck={newUserCheck} />
    </main>
  );
}
