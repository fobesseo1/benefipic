// app/main/page.tsx
import { Suspense } from 'react';
import MainComponent from './MainComponent';
import { getUser, createSupabaseServerClient } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';
import MetaInAppAlert from './MetaInAppAlert';
import NewUserWelcomeAlert from '../components/shared/ui/NewUserWelcomeAlert';
import { isNewUser } from '@/utils/ad-utils';
import TutorialContainer from './TutorialContainer';
import PWAInstallAlert from './PWAInstallAlert';

// app/main/page.tsx
export default async function MainPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;
  const isNewUserCheck = isNewUser(currentUser.created_at);

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  const supabase = createSupabaseServerClient();

  // tutorial_fin만 가져오기
  const { data: healthRecord, error: healthError } = await supabase
    .from('health_records')
    .select('tutorial_fin')
    .eq('user_id', currentUser_id)
    .single();

  if (healthError || !healthRecord) {
    redirect('/question');
  }

  // target_weight 존재 여부만 확인
  const { count: fitnessGoalExists, error: fitnessError } = await supabase
    .from('fitness_goals')
    .select('target_weight', { count: 'exact', head: true })
    .eq('user_id', currentUser_id)
    .eq('status', 'active')
    .single();

  if (fitnessError || !fitnessGoalExists) {
    redirect('/health-info');
  }

  return (
    <Suspense>
      <PWAInstallAlert
        userId={currentUser_id}
        lastPromptDate={currentUser.last_install_prompt}
        isInstalled={currentUser.pwa_installed}
      />
      <MetaInAppAlert />
      {isNewUserCheck && <NewUserWelcomeAlert />}
      <TutorialContainer
        isNewUser={isNewUserCheck}
        tutorialFinished={healthRecord.tutorial_fin}
        user_id={currentUser_id}
      />
      <MainComponent user_id={currentUser_id} />
    </Suspense>
  );
}
