import TopNavigation from '../TopNavigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function FoodPage() {
  const topNavigationTitle = '식사';

  return (
    <div className="w-full max-w-xl flex flex-col gap-6">
      <TopNavigation topNavigationTitle={topNavigationTitle} />
      <div className="flex flex-col gap-6 mx-4">
        {/* 입력버튼 */}
        <div className="flex flex-col gap-2">
          <Link href="/food/input">
            <Button variant="outline" className="w-full py-6">
              <p>🥄 식사 기록</p>
            </Button>
          </Link>
          <hr />
          <Link href="/food/check">
            <Button variant="outline" className="w-full py-6 ">
              <p>
                🤔 음식 체크
                <span className="text-xs tracking-tighter text-gray-600"> (먹을까? 말까?)</span>
              </p>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
