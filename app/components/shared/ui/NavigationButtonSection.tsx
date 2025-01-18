'use client';

import { useState, useCallback } from 'react';
import { Camera as CameraIcon, ImageIcon, X } from 'lucide-react';
import Camera, { FACING_MODES, IMAGE_TYPES } from 'react-html5-camera-photo';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createDualQualityImages } from '@/utils/image';
import 'react-html5-camera-photo/build/css/index.css';

interface NavigationButtonSectionProps {
  step:
    | 'initial'
    | 'camera'
    | 'image-selected'
    | 'filter-selection'
    | 'compress'
    | 'analyzing'
    | 'calculate'
    | 'health-check'
    | 'complete';
  setStep: (step: NavigationButtonSectionProps['step']) => void;
  setSelectedImage: (file: File | null) => void;
  setAnalysisImage: (file: File | null) => void;
  setImageUrl: (url: string) => void;
  onAnalyze: () => Promise<void>;
  onSave?: () => Promise<void>;
  resetAnalyzer?: () => void;
}

export default function NavigationButtonSection({
  step,
  setStep,
  setSelectedImage,
  setAnalysisImage,
  setImageUrl,
  onAnalyze,
  onSave,
  resetAnalyzer,
}: NavigationButtonSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // 카메라 촬영 핸들러
  const handleTakePhoto = async (dataUri: string) => {
    try {
      const response = await fetch(dataUri);
      const blob = await response.blob();
      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });

      const { displayImage, analysisImage } = await createDualQualityImages(file);

      setSelectedImage(displayImage);
      setAnalysisImage(analysisImage);
      setImageUrl(URL.createObjectURL(displayImage));
      setStep('image-selected');
      setDialogOpen(false);
    } catch (error) {
      console.error('Camera capture failed:', error);
    }
  };

  // 카메라 뷰 컴포넌트
  const CameraView = () => (
    <div className="relative w-full h-[70vh]">
      <Camera
        onTakePhoto={handleTakePhoto}
        idealFacingMode={FACING_MODES.ENVIRONMENT}
        imageType={IMAGE_TYPES.JPG}
        imageCompression={0.97}
        isImageMirror={false}
        isSilentMode={false}
        isDisplayStartCameraError={true}
        isFullscreen={false}
        sizeFactor={1}
      />
    </div>
  );

  // 갤러리 뷰 컴포넌트
  const GalleryView = () => {
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const reader = new FileReader();

        reader.onload = async (e: ProgressEvent<FileReader>) => {
          try {
            const { displayImage, analysisImage } = await createDualQualityImages(file);

            if (e.target?.result && typeof e.target.result === 'string') {
              setSelectedImage(displayImage);
              setAnalysisImage(analysisImage);
              setImageUrl(e.target.result);
              setStep('image-selected');
              setDialogOpen(false);
              setGalleryOpen(false);
            }
          } catch (error) {
            console.error('이미지 처리 오류:', error);
          }
        };

        reader.readAsDataURL(file);
      }
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
      onDrop,
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.heic'],
      },
      maxFiles: 1,
    });

    return (
      <div
        {...getRootProps()}
        className="w-full h-[40vh] border-2 border-dashed border-gray-300 rounded-xl 
                   flex flex-col items-center justify-center gap-4 cursor-pointer
                   hover:border-gray-400 transition-colors"
      >
        <input {...getInputProps()} />
        <ImageIcon className="w-12 h-12 text-gray-400" />
        <div className="text-center">
          <p className="font-medium">이미지를 선택하거나</p>
          <p className="text-gray-500">여기로 드래그하세요</p>
        </div>
      </div>
    );
  };

  return (
    <>
      {step === 'compress' || step === 'analyzing' || step === 'calculate' ? null : (
        <div className="absolute bottom-0 w-full px-6 pb-8 bg-white">
          {step === 'image-selected' ? (
            <div className="flex flex-col gap-4 pt-8 pb-48">
              <button
                onClick={() => setStep('filter-selection')}
                className="w-full bg-black text-white rounded-xl py-2 text-lg font-medium flex flex-col items-center justify-center"
              >
                <p>다음으로</p>
                <p className="text-xs tracking-tighter">(음식과 어울리는 이미지 필터 선택하기)</p>
              </button>
              <button
                onClick={resetAnalyzer}
                className="w-full bg-gray-200 text-gray-600 rounded-xl py-4 text-lg font-medium"
              >
                돌아가기
              </button>
            </div>
          ) : step === 'filter-selection' ? (
            <div className="flex flex-col gap-4 pt-8 pb-48">
              <button
                onClick={onAnalyze}
                className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
              >
                분석하기
              </button>
              <button
                onClick={() => setStep('image-selected')}
                className="w-full bg-gray-200 text-gray-600 rounded-xl py-4 text-lg font-medium"
              >
                돌아가기
              </button>
            </div>
          ) : step === 'complete' ? (
            <div className="flex gap-2">
              <button
                onClick={resetAnalyzer}
                className="w-full bg-gray-100 text-gray-400 rounded-xl py-4 text-lg font-medium"
              >
                다시하기
              </button>
              <button
                onClick={onSave}
                className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
              >
                저장하기
              </button>
            </div>
          ) : (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium flex items-center justify-center gap-4">
                  <CameraIcon className="w-8 h-8" />
                  <p>촬영하기 / 불러오기</p>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>촬영하기 / 불러오기</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {!galleryOpen ? (
                    <>
                      <CameraView />
                      <button
                        onClick={() => setGalleryOpen(true)}
                        className="w-full p-4 bg-gray-100 text-gray-900 rounded-xl 
                                  flex items-center justify-center gap-2"
                      >
                        <ImageIcon className="w-5 h-5" />
                        <span>갤러리에서 선택하기</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <GalleryView />
                      <button
                        onClick={() => setGalleryOpen(false)}
                        className="w-full p-4 bg-gray-100 text-gray-900 rounded-xl 
                                  flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        <span>카메라로 돌아가기</span>
                      </button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </>
  );
}
