// app/main/page.tsx
import { Suspense } from 'react';
import MainComponent from './MainComponent';
import { getUser, createSupabaseServerClient } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';
import MetaInAppAlert from './MetaInAppAlert';
import NewUserWelcomeAlert from '../components/shared/ui/NewUserWelcomeAlert';
import { isNewUser } from '@/utils/ad-utils';
import TutorialOverlay from './TutorialOverlay';
import TutorialContainer from './TutorialContainer';

export default async function MainPage() {
  const currentUser = await getUser();

  const currentUser_id = currentUser?.id;

  // 신규 유저 체크
  const isNewUserCheck = isNewUser(currentUser.created_at);

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  // Supabase 서버 클라이언트 생성
  const supabase = createSupabaseServerClient();

  // 1. health_records 테이블 확인
  const { data: healthRecord, error: healthError } = await supabase
    .from('health_records')
    .select('*')
    .eq('user_id', currentUser_id)
    .single();

  if (healthError || !healthRecord) {
    redirect('/question');
  }

  // 2. fitness_goals 테이블 확인
  const { data: fitnessGoal, error: fitnessError } = await supabase
    .from('fitness_goals')
    .select('*')
    .eq('user_id', currentUser_id)
    .eq('status', 'active')
    .single();

  if (fitnessError || !fitnessGoal) {
    redirect('/health-info');
  }

  return (
    <Suspense>
      <MetaInAppAlert />
      {isNewUserCheck && <NewUserWelcomeAlert />}
      <TutorialContainer isNewUser={isNewUserCheck} />
      <MainComponent user_id={currentUser_id} />
    </Suspense>
  );
}
