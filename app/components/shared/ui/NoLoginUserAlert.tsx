import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function NoLoginUserAlert() {
  return (
    <div className="min-h-screen container mx-auto p-8 flex flex-col items-center justify-center">
      <Alert className="max-w-md w-full flex flex-col items-center gap-4 px-6 py-12 shadow-lg">
        <AlertTitle>로그인이 필요합니다</AlertTitle>
        <AlertDescription className="mt-2 text-gray-800 tracking-tighter whitespace-pre-line text-center">
          {`이 페이지를 이용하기 위해서는\n로그인이 필요합니다.`}
          <div className="mt-4">
            <Link href="/auth">
              <Button className="w-full p-6 bg-black text-white">
                로그인/회원가입 페이지로 이동
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
