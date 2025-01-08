// app/health-info/page.tsx
import HealthCalculateForm from './HealthCalculatorForm';
import { getUser } from '@/lib/supabse/server';
import { createSupabaseServerClient } from '@/lib/supabse/server';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const slides = [
  {
    id: 'input',
    title: '목표 설정',
    subtitle: '목표 체중과 기간을 입력해주세요',
  },
  {
    id: 'result',
    title: '분석 결과',
    subtitle: '입력하신 정보를 바탕으로 분석한 결과입니다.',
  },
];

export default async function HealthCalculatorPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  if (!currentUser_id) {
    redirect('/auth');
  }

  const supabase = createSupabaseServerClient();

  const { data: healthRecord, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('user_id', currentUser_id)
    .single();

  if (error || !healthRecord) {
    redirect('/question');
  }

  return (
    <div className="min-h-screen flex flex-col bg-white p-4">
      {/* Header - Back button and Progress bar */}
      <div className="  pb-2">
        <div className="flex items-center gap-4">
          <Link href="/main" className="p-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-black" style={{ width: '50%' }} />
          </div>
        </div>
      </div>

      {/* Title Section */}
      <div className="py-4">
        <h1 className="text-2xl font-semibold">{slides[0].title}</h1>
        <p className="text-gray-500 text-sm mt-2">{slides[0].subtitle}</p>
      </div>

      {/* Main Content */}
      <HealthCalculateForm currentUser_id={currentUser_id} initialHealthRecord={healthRecord} />
    </div>
  );
}
