'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera } from 'lucide-react';
import Link from 'next/link';
import KakaoButton from '../auth/components/OAuthForm_Kakao';
import GoogleButton from '../auth/components/OAuthForm_Google';
import KakaoButtonInApp from '../auth/components/OAuthForm_Kakao_InApp';

interface Slide {
  title: string;
  subtitle: string;
  bulletPoints: string[];
  icon: React.ReactNode | null;
  image: string;
}

const OnboardingScreen = ({ defaultSlide }: { defaultSlide: number }) => {
  const [currentSlide, setCurrentSlide] = useState(defaultSlide);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    const isInApp = sessionStorage.getItem('isInAppBrowser') === 'true';
    setIsInAppBrowser(isInApp);

    if (defaultSlide >= 0 && defaultSlide < slides.length) {
      setCurrentSlide(defaultSlide);
    }
  }, [defaultSlide]);

  const slides: Slide[] = [
    {
      title: '찍기만 하면 끝!',
      subtitle: '사진 한 장으로 완성되는\n오늘의 식단 기록',
      bulletPoints: ['자동으로 계산되는 칼로리와 영양소', '더 특별해지는 나의 기록'],
      icon: <Camera className="w-9 h-9" />,
      image: '/start/start-1.jpg',
    },
    {
      title: '지금 바로 시작하세요',
      subtitle: '',
      bulletPoints: [],
      icon: null,
      image: '/start/start-end.jpg',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  return (
    <div className="min-h-screen min-w-screen flex flex-col">
      {/* Image Section */}
      <div className="w-full aspect-square">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 160, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -160, opacity: 0 }}
            className="h-full"
          >
            <img
              src={slides[currentSlide].image}
              alt={`Onboarding ${currentSlide + 1}`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col px-6 pt-8 pb-4 rounded-t-3xl bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="flex-1 flex flex-col space-y-4"
          >
            {currentSlide === 0 ? (
              // 첫 번째 슬라이드 내용 (기존과 동일)
              <div className="space-y-2 tracking-tighter">
                <h1 className="text-3xl font-bold text-gray-900 whitespace-pre-line border-b-[1px] border-gray-900 pb-2">
                  찍기만 하면 끝!
                  <span className="inline-flex items-center align-middle pb-1 ml-2 text-gray-600">
                    {slides[0].icon}
                  </span>
                </h1>
                <h2 className="text-lg font-medium text-gray-700 whitespace-pre-line border-b-[1px] border-gray-200 pb-2">
                  AI가 분석하는 맞춤형 식단관리
                </h2>
                <p className="text-base text-gray-600 pt-2">
                  사진 한 장으로 자동 계산되는
                  <br />
                  칼로리와 영양 정보
                </p>
              </div>
            ) : (
              // 두 번째 슬라이드 내용
              <div className="space-y-2 tracking-tighter">
                <h1 className="text-3xl font-bold text-gray-900 whitespace-pre-line border-b-[1px] border-gray-900 pb-2">
                  당신의 건강한 하루
                </h1>
                <h2 className="text-lg font-medium text-gray-700 whitespace-pre-line border-b-[1px] border-gray-200 pb-2">
                  매일매일 기록되는 새로운 변화
                </h2>
                <p className="text-base text-gray-600 pt-2">
                  AI가 당신의 식사를 분석하는 동안 <br /> 식사와 운동만 집중하세요!
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Section */}
      <div className="px-6 pb-8 space-y-4 bg-white">
        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mb-4">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentSlide === index ? 'bg-black' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Next/Start Button */}
        {currentSlide === 0 ? (
          <button
            onClick={handleNext}
            className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        ) : // 두 번째 슬라이드 버튼
        isInAppBrowser ? (
          <KakaoButtonInApp />
        ) : (
          <Link href="/auth" className="block">
            <button className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium hover:bg-gray-800 transition-colors">
              3초만에 시작하기
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;
