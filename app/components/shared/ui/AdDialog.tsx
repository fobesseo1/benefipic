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
          <AlertDialogTitle className="tracking-tighter">
            광고 링크 이동 후 {AD_FREE_HOURS}시간 무제한 이용👌
          </AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-2">
            <p className="whitespace-pre-line">{`AI 분석 기능을 계속 사용하시려면\n광고 페이지로 이동해주세요.\n광고 시청 후 ${AD_FREE_HOURS}시간 동안\n제한 없이 이용하실 수 있습니다.`}</p>
            <div className="mt-4 w-full aspect-square bg-gray-100 flex flex-col items-center justify-center gap-4 shadow-lg">
              <img src="/ad-coupang.png" alt="ad-coupang" className="w-3/4 object-cover" />
              <p className="text-xl">쿠팡으로 이동하기</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex flex-col gap-2 mt-4">
            <Button className="p-6" onClick={handleAdClick}>
              쿠팡 바로 가기 (광고)
            </Button>
            <Button className="p-6" variant={'outline'} onClick={onClose}>
              취소
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AdDialog;
