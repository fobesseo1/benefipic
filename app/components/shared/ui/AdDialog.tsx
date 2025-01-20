declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

import { AD_FREE_HOURS } from '@/app/hooks/useAnalysisEligibility';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import InAppSpy from 'inapp-spy';

interface AdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdComplete: () => void;
}

const AD_URL = 'https://link.coupang.com/a/b8Yjpm';

const AdDialog: React.FC<AdDialogProps> = ({ isOpen, onClose, onAdComplete }) => {
  const handleAdClick = () => {
    // 광고 완료 처리를 먼저 실행하여 현재 상태 유지
    onAdComplete();

    // InAppSpy로 직접 인앱 브라우저 체크
    const { appKey } = InAppSpy();
    const isInAppBrowser = appKey === 'instagram' || appKey === 'threads' || appKey === 'facebook';

    // PWA 체크
    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore
      window.navigator.standalone;

    try {
      // 1. 일반 브라우저 (크롬, 사파리 등)
      if (!isPWA && !isInAppBrowser) {
        const newWindow = window.open('about:blank', '_blank', 'noopener,noreferrer');
        if (newWindow) {
          newWindow.location.href = AD_URL;
        }
        return;
      }

      // 2. PWA
      if (isPWA) {
        const newWindow = window.open(AD_URL, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          // 팝업이 차단된 경우
          const a = document.createElement('a');
          a.href = AD_URL;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.click();
        }
        return;
      }

      // 3. 인앱 브라우저
      if (isInAppBrowser) {
        const a = document.createElement('a');
        a.href = AD_URL;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      }
    } catch (error) {
      console.error('광고 창 열기 실패:', error);
      // 에러 발생 시 가장 안전한 방법으로 시도
      const a = document.createElement('a');
      a.href = AD_URL;
      a.target = '_blank';
      a.rel = 'noopener,noreferrer';
      a.click();
    }
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="tracking-tighter font-normal pt-4">
            광고 링크 이동 후 <span className="text-3xl font-semibold">{AD_FREE_HOURS}</span>시간{' '}
            <span className="text-2xl font-semibold">무제한</span> 이용
          </AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-2">
            <div className="flex flex-col tracking-tighter pb-4">
              <p>AI 분석 기능을 계속 사용하시려면</p>
              <p>광고 페이지 방문 후 이용부탁드립니다</p>
            </div>
            <div
              className="mt-4 w-full aspect-square bg-gray-100 flex flex-col items-center justify-center gap-4 shadow-lg cursor-pointer"
              onClick={handleAdClick}
            >
              <img src="/ad-coupang.png" alt="ad-coupang" className="w-3/4 object-cover" />
              <div className="flex flex-col items-center justify-center gap-1">
                <p className="text-xl">쿠팡으로 이동하기</p>
                <hr className="border-gray-400 w-full" />
                <p className="text-lg text-gray-900 font-semibold">
                  {AD_FREE_HOURS}시간 동안 제한 없이 사용 👌
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex flex-col gap-2 mt-4">
            <Button className="p-6 text-lg tracking-tighter" onClick={handleAdClick}>
              쿠팡 바로 가기 (광고)
            </Button>
            <Button className="p-6 text-gray-400 font-normal" variant="outline" onClick={onClose}>
              취소
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AdDialog;
