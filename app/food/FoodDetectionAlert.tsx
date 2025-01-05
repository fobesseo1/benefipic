import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FoodDetectionAlertProps {
  isOpen: boolean;
  onClose: () => void;
  detectedContent: string;
}

const FoodDetectionAlert: React.FC<FoodDetectionAlertProps> = ({
  isOpen,
  onClose,
  detectedContent,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">음식이 아닌 이미지 감지됨</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>{detectedContent}</p>
            <p className="text-sm text-gray-600">다른 음식 이미지를 선택해주세요.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FoodDetectionAlert;
