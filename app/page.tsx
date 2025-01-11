import { createSupabaseServerClient, getUser } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

async function UserCheck() {
  const currentUser = await getUser();

  if (!currentUser) {
    redirect('/start');
  }
  return currentUser;
}

// JSX를 반환하도록 수정
async function HealthRecordCheck({ userId }: { userId: string }) {
  const supabase = await createSupabaseServerClient();
  const { data: healthRecords } = await supabase
    .from('health_records')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (healthRecords) {
    redirect('/main');
  } else {
    redirect('/question');
  }

  // 리다이렉션이 발생하기 전에 로딩 UI 반환
  return (
    <div className="w-full h-[100vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">건강 기록 확인 완료</h2>
        <p className="text-gray-500">페이지 이동 중...</p>
      </div>
    </div>
  );
}

function CheckingUser() {
  return (
    <div className="w-full h-[100vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">사용자 확인 중</h2>
        <p className="text-gray-500">로그인 상태를 확인하고 있습니다...</p>
      </div>
    </div>
  );
}

function CheckingHealthRecord() {
  return (
    <div className="w-full h-[100vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">건강 기록 확인 중</h2>
        <p className="text-gray-500">사용자의 건강 기록을 확인하고 있습니다...</p>
      </div>
    </div>
  );
}

export default async function Home() {
  return (
    <Suspense fallback={<CheckingUser />}>
      <UserCheckWrapper />
    </Suspense>
  );
}

async function UserCheckWrapper() {
  const currentUser = await UserCheck();

  return (
    <Suspense fallback={<CheckingHealthRecord />}>
      <HealthRecordCheck userId={currentUser.id} />
    </Suspense>
  );
}
