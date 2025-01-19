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

interface AdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdComplete: () => void;
}

const AD_URL = 'https://link.coupang.com/a/b8Yjpm';

const AdDialog: React.FC<AdDialogProps> = ({ isOpen, onClose, onAdComplete }) => {
  const handleAdClick = () => {
    try {
      // 1. 먼저 사용자 작업 상태 저장
      onAdComplete();
      
      // 2. PWA 체크 (iOS Safari 및 다른 브라우저 대응)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          // @ts-ignore iOS Safari standalone 속성
                          window.navigator.standalone || 
                          document.referrer.includes('android-app://');
      
      if (isStandalone) {
        // PWA에서 실행 시 system 브라우저로 강제 오픈
        window.open(AD_URL, '_system', 'noopener,noreferrer');
      } else {
        // 일반 브라우저에서 실행 시
        const newWindow = window.open('about:blank', '_blank');
        if (newWindow) {
          newWindow.location.href = AD_URL;
        } else {
          // 팝업이 차단된 경우 DOM 방식으로 시도
          const link = document.createElement('a');
          link.href = AD_URL;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

    } catch (error) {
      console.error('광고 열기 실패:', error);
      // 에러 발생 시에도 마지막 시도
      const link = document.createElement('a');
      link.href = AD_URL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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