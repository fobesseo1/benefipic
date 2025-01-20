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
import { useRouter } from 'next/navigation';

interface AdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdComplete: () => Promise<void>;
}

const AD_URL = 'https://link.coupang.com/a/b8Yjpm';

const AdDialog: React.FC<AdDialogProps> = ({ isOpen, onClose, onAdComplete }) => {
  const router = useRouter();
  const handleAdClick = async () => {
    const { appKey } = InAppSpy();
    const isInAppBrowser = appKey === 'instagram' || appKey === 'threads' || appKey === 'facebook';

    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    try {
      // 실제 HTML 링크를 만들어서 DOM에 추가
      const adLink = document.createElement('a');
      adLink.href = AD_URL;
      adLink.target = '_system';
      adLink.rel = 'noopener noreferrer';
      document.body.appendChild(adLink);

      if (!isPWA && !isInAppBrowser) {
        // 새 창에서 광고 URL 열기
        window.open(AD_URL, '_blank');
        // 광고 시청 완료 처리
        onAdComplete();
      }

      // PWA
      if (isPWA) {
        await onAdComplete();
        const newWindow = window.open(AD_URL, '_system', 'noopener,noreferrer');
        if (!newWindow) {
          adLink.click();
        }
        document.body.removeChild(adLink);
        return;
      }

      // 인앱 브라우저
      if (isInAppBrowser) {
        const newWindow = window.open(AD_URL, '_system', 'noopener,noreferrer');
        if (!newWindow) {
          window.open(AD_URL, '_system');
        }
        document.body.removeChild(adLink);
      }
    } catch (error) {
      console.error('광고 창 열기 실패:', error);
      window.open(AD_URL, '_system', 'noopener,noreferrer');
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
