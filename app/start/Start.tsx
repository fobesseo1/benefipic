'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChartBar, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Slide {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  image: string;
}

const OnboardingScreen = ({ defaultSlide }: { defaultSlide: number }) => {
  const [currentSlide, setCurrentSlide] = useState(defaultSlide);

  useEffect(() => {
    if (defaultSlide >= 0 && defaultSlide < slides.length) {
      setCurrentSlide(defaultSlide);
    }
  }, [defaultSlide]);

  const slides: Slide[] = [
    {
      title: '찍기만 하면 끝!',
      subtitle: '음식 사진만 찍어도 우리가 다 알려줄게요',
      icon: <Camera className="w-8 h-8" />,
      image: '/start/start-1.jpg',
    },
    {
      title: '오늘도 인증 완료!',
      subtitle: '찍을수록 성장하는 나의 건강 스토리',
      icon: <ChartBar className="w-8 h-8" />,
      image: '/start/start-2.jpg',
    },
    {
      title: '건강한 변화의 시작',
      subtitle: '오늘 먹은 식사 찍으러 가볼까요?',
      icon: <Sparkles className="w-8 h-8" />,
      image: '/start/start-3.jpg',
    },
  ];
  // const slides: Slide[] = [
  //   {
  //     title: '칼로리 계산 너무 쉬워요',
  //     subtitle: '그냥 사진만 찍으시면 저희가 알려드릴게요',
  //     icon: <Camera className="w-8 h-8" />,
  //     image: '/start/start-1.png',
  //   },
  //   {
  //     title: 'AI를 통한 분석',
  //     subtitle: '여러분이 드시는\n식사의 칼로리와 영양소를 분석해드릴게요',
  //     icon: <ChartBar className="w-8 h-8" />,
  //     image: '/start/start-2.png',
  //   },
  //   {
  //     title: '이제 시작해요',
  //     subtitle: '오늘이 여러분이 꿈꾸던 핏을 시작하기\n가장 좋은 날이에요',
  //     icon: <Sparkles className="w-8 h-8" />,
  //     image: '/start/start-3.png',
  //   },
  // ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  return (
    <div className="min-h-screen min-w-screen flex flex-col ">
      {/* Image Section - Fixed at top */}
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

      {/* Content Section - Flexible space */}
      <div className="flex-1 flex flex-col px-6 py-8 rounded-t-3xl bg-white ">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Icon and Title in one line */}
            <div className="flex flex-col justify-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                {slides[currentSlide].icon}
                <h2 className="text-2xl font-semibold text-gray-900">
                  {slides[currentSlide].title}
                </h2>
              </div>
            </div>

            {/* Subtitle with line breaks */}
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {slides[currentSlide].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Section - Fixed at bottom */}
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
        {currentSlide === slides.length - 1 ? (
          <Link href="/auth" className="block">
            <button className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium hover:bg-gray-800 transition-colors">
              시작하기
            </button>
          </Link>
        ) : (
          <button
            onClick={handleNext}
            className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;
