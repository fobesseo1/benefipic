import { AD_FREE_HOURS } from '@/app/hooks/useAnalysisEligibility';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface AdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdComplete: () => void;
}

const AD_URL = 'https://link.coupang.com/a/b8Yjpm'; // 쿠팡 광고 URL

const AdDialog: React.FC<AdDialogProps> = ({ isOpen, onClose, onAdComplete }) => {
  const handleAdClick = () => {
    try {
      // 항상 새 창에서 열기 시도
      const newWindow = window.open(AD_URL, '_blank');

      // 팝업이 차단되었거나 실패한 경우
      if (newWindow === null || newWindow.closed) {
        // 현재 창에서 열기로 폴백
        window.location.href = AD_URL;
      }
    } catch (error) {
      // 에러 발생 시 현재 창에서 열기
      window.location.href = AD_URL;
    }

    onAdComplete();
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
              <p className="">AI 분석 기능을 계속 사용하시려면</p>
              <p>광고 페이지 방문 후 이용부탁드립니다;;</p>
              {/* <p className="text-base text-gray-900 font-semibold pt-1">
                {AD_FREE_HOURS}시간 동안 제한 없이 사용 👌
              </p> */}
            </div>
            <div
              className="mt-4 w-full aspect-square bg-gray-100 flex flex-col items-center justify-center gap-4 shadow-lg"
              onClick={handleAdClick}
            >
              <img src="/ad-coupang.png" alt="ad-coupang" className="w-3/4 object-cover" />
              <div className="flex flex-col items-center justify-center gap-1">
                <p className="text-xl">쿠팡으로 이동하기</p>
                <hr className="border-gray-400 w-full" />
                <p className="text-lg text-gray-900 font-semibold ">
                  {AD_FREE_HOURS}시간 동안 제한 없이 사용 👌
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex flex-col gap-2 mt-4">
            <Button className="p-6 text-lg tracking-tighter " onClick={handleAdClick}>
              쿠팡 바로 가기 (광고)
            </Button>
            <Button className="p-6 text-gray-400 font-normal" variant={'outline'} onClick={onClose}>
              취소
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AdDialog;
