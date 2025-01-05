import React from 'react';
import HealthCalculateForm from './HealthCalculatorForm';
import { getUser } from '@/lib/supabse/server';
import { createSupabaseServerClient } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';

export default async function HealthCalculatorPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  if (!currentUser_id) {
    redirect('/auth');
  }

  // Supabase 서버 클라이언트 생성
  const supabase = createSupabaseServerClient();

  // health_records 테이블 확인
  const { data: healthRecord, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('user_id', currentUser_id)
    .single();

  // 레코드가 없거나 에러가 있으면 /question으로 리다이렉트
  if (error || !healthRecord) {
    redirect('/question');
  }

  return (
    <div>
      <HealthCalculateForm currentUser_id={currentUser_id} />
    </div>
  );
}
