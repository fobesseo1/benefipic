// app/main/page.tsx
import { Suspense } from 'react';
import MainComponent from './MainComponent';
import { getUser, createSupabaseServerClient } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';

export default async function MainPage() {
  const currentUser = await getUser();
  const user_id = currentUser?.id;

  if (!currentUser) {
    redirect('/auth');
  }

  // Supabase 서버 클라이언트 생성
  const supabase = createSupabaseServerClient();

  // 1. health_records 테이블 확인
  const { data: healthRecord, error: healthError } = await supabase
    .from('health_records')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (healthError || !healthRecord) {
    redirect('/question');
  }

  // 2. fitness_goals 테이블 확인
  const { data: fitnessGoal, error: fitnessError } = await supabase
    .from('fitness_goals')
    .select('*')
    .eq('user_id', user_id)
    .eq('status', 'active')
    .single();

  if (fitnessError || !fitnessGoal) {
    redirect('/health-info');
  }

  return (
    <Suspense>
      <MainComponent user_id={user_id} />
    </Suspense>
  );
}
