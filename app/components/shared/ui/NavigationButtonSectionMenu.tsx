'use client';

import { useState, useCallback } from 'react';
import { Camera as CameraIcon, ImageIcon, MousePointerClick, RefreshCcw, X } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { FacingModeType } from './NavigationButtonSectionExercise';

interface NavigationButtonSectionProps {
  step:
    | 'initial'
    | 'camera'
    | 'image-selected'
    | 'compress'
    | 'analyzing'
    | 'calculate'
    | 'health-check'
    | 'complete';
  setStep: (
    step:
      | 'initial'
      | 'camera'
      | 'image-selected'
      | 'compress'
      | 'analyzing'
      | 'calculate'
      | 'health-check'
      | 'complete'
  ) => void;
  setSelectedImage: (file: File | null) => void;
  setAnalysisImage: (file: File | null) => void;
  setDisplayImage: (file: File | null) => void;
  setImageUrl: (url: string) => void;
  onAnalyze: () => Promise<void>;

  resetAnalyzer?: () => void; // 추가
}

export default function NavigationButtonSectionMenu({
  step,
  setStep,
  setSelectedImage,
  setAnalysisImage,
  setDisplayImage,
  setImageUrl,
  onAnalyze,

  resetAnalyzer,
}: NavigationButtonSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [currentFacingMode, setCurrentFacingMode] = useState<FacingModeType>(
    FACING_MODES.ENVIRONMENT
  );

  const handleTakePhoto = async (dataUri: string) => {
    try {
      const response = await fetch(dataUri);
      const blob = await response.blob();
      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });

      const { displayImage, analysisImage } = await createDualQualityImages(file);
      setDisplayImage(displayImage);
      setSelectedImage(displayImage);
      setAnalysisImage(analysisImage);
      setImageUrl(URL.createObjectURL(displayImage));
      setStep('image-selected');
      setDialogOpen(false);
    } catch (error) {
      console.error('Camera capture failed:', error);
    }
  };

  const toggleCamera = useCallback(() => {
    setCurrentFacingMode((prevMode) =>
      prevMode === FACING_MODES.USER ? FACING_MODES.ENVIRONMENT : FACING_MODES.USER
    );
  }, []);

  // 카메라 뷰 컴포넌트
  const CameraView = () => (
    <div className="relative w-full h-[70vh]">
      <Camera
        onTakePhoto={handleTakePhoto}
        idealFacingMode={currentFacingMode}
        imageType={IMAGE_TYPES.JPG}
        imageCompression={0.97}
        isImageMirror={currentFacingMode === FACING_MODES.USER}
        isSilentMode={false}
        isDisplayStartCameraError={true}
        isFullscreen={false}
        sizeFactor={1}
      />
      <div
        onClick={toggleCamera}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 p-4 px-6 bg-gray-200 rounded-full flex items-center justify-center gap-2"
      >
        <RefreshCcw className="w-6 h-6 " />
        <p>카메라 전환</p>
      </div>
    </div>
  );

  const GalleryView = () => {
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setIsLoading(true);
        const file = acceptedFiles[0];
        try {
          const { displayImage, analysisImage } = await createDualQualityImages(file);

          const reader = new FileReader();
          reader.onload = (e) => {
            setImageUrl(e.target?.result as string);
            setIsLoading(false);
          };
          reader.readAsDataURL(displayImage);
          setDisplayImage(displayImage);
          setSelectedImage(displayImage);
          setAnalysisImage(analysisImage);
          setStep('image-selected');
          setDialogOpen(false);
          setGalleryOpen(false);
        } catch (error) {
          console.error('이미지 처리 오류:', error);
          setIsLoading(false);
        }
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
        <MousePointerClick className="w-12 h-12 text-gray-400" />
        <div className="text-center">
          <p className="font-medium">이 곳을 터치하고</p>
          <p className="text-gray-500">사진을 선택하세요</p>
        </div>
      </div>
    );
  };

  const handleHomeClick = () => {
    router.push('/main');
  };

  return (
    <>
      {step === 'compress' || step === 'analyzing' || step === 'calculate' ? null : (
        <div className="absolute bottom-0 w-full px-6 pb-8 bg-white">
          {step === 'image-selected' ? (
            <div className="flex flex-col gap-4 pt-8 pb-48">
              <button
                onClick={() => {
                  setStep('analyzing');
                  onAnalyze(); // 추가
                }}
                className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium flex flex-col items-center justify-center"
              >
                분석하기
              </button>
              <button
                onClick={resetAnalyzer}
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
                onClick={handleHomeClick}
                className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
              >
                홈으로
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
