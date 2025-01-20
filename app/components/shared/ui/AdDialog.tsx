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
  onAdComplete: () => Promise<void>;
}

//광고링크
const AD_URL = 'https://link.coupang.com/a/b8Yjpm';

const AdDialog: React.FC<AdDialogProps> = ({ isOpen, onClose, onAdComplete }) => {
  const handleAdClick = async () => {
    const { appKey } = InAppSpy();
    const isInAppBrowser = appKey === 'instagram' || appKey === 'threads' || appKey === 'facebook';

    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore
      window.navigator.standalone;

    try {
      // 1. 일반 브라우저 (크롬)
      if (!isPWA && !isInAppBrowser) {
        // Promise 실행만 하고 기다리지 않음
        onAdComplete().then(() => {
          window.open(AD_URL, '_blank', 'noopener,noreferrer');
        });
        return;
      }

      // PWA (변경하지 않음 - 잘 동작하는 코드)
      if (isPWA) {
        onAdComplete();
        const newWindow = window.open(AD_URL, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          const a = document.createElement('a');
          a.href = AD_URL;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.click();
        }
        return;
      }

      // 4. 인앱 브라우저
      if (isInAppBrowser) {
        const newWindow = window.open(AD_URL, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          window.open(AD_URL, '_system');
        }
      }
    } catch (error) {
      console.error('광고 창 열기 실패:', error);
      window.open(AD_URL, '_blank', 'noopener,noreferrer');
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
