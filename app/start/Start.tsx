'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChartBar, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Slide {
  title: string;
  subtitle: string;
  bulletPoints: string[];
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

  // const slides: Slide[] = [
  //   {
  //     title: '찍기만 하면 끝!',
  //     subtitle: `사진 한 장으로 완성되는\n건강 관리의 모든 것`,
  //     bulletPoints: ['사진만 찍으면', 'AI가 알아서 분석, 저장'],
  //     icon: <Camera className="w-9 h-9" />,
  //     image: '/start/start-1.jpg',
  //   },
  // ];
  const slides: Slide[] = [
    {
      title: '찍기만 하면 끝!',
      subtitle: `사진 한 장으로 완성되는\n오늘의 식단 기록`,
      bulletPoints: ['칼로리는 AI가 척척', '특별해지는 일상의 한 끼'],
      icon: <Camera className="w-9 h-9" />,
      image: '/start/start-1.jpg',
    },
    {
      title: '운동도 찍으면 끝!',
      subtitle: `셀카 한 장으로 자동 기록되는\n오늘의 운동`,
      bulletPoints: ['스타일리시한 운동 기록은 덤', '정확한 운동량까지 자동 계산'],
      icon: <Camera className="w-9 h-9" />,
      image: '/start/start-2.jpg',
    },
    {
      title: `기록이 쌓일수록\n빛나는 나`,
      subtitle: '특별한 순간이 되는 일상의 기록들',
      bulletPoints: ['건강해지는 나의 모습', '매일매일 성장하는 기록'],
      icon: <ChartBar className="w-8 h-8" />,
      image: '/start/start-3.jpg',
    },
    {
      title: `더 간편하게,\n더 스타일리시하게`,
      subtitle: '건강한 일상이 특별해지는 순간',
      bulletPoints: ['AI가 계산하고 분석하는 동안', '당신은 찍기만 하세요'],
      icon: <Sparkles className="w-8 h-8" />,
      image: '/start/start-4.jpg',
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
            {/* Title & Subtitle */}
            <div className="space-y-2 tracking-tighter">
              <h1 className="text-3xl font-bold text-gray-900 whitespace-pre-line border-b-[1px] border-gray-900 pb-2">
                {slides[currentSlide].title.split('\n').map((line, index, array) => (
                  <React.Fragment key={index}>
                    {line}
                    {index === array.length - 1 && (
                      <span className="inline-flex items-center align-middle pb-1 ml-2 text-gray-600">
                        {slides[currentSlide].icon}
                      </span>
                    )}
                    {index !== array.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h1>
              <h2 className="text-lg font-medium text-gray-700 whitespace-pre-line border-b-[1px] border-gray-200 pb-2">
                {slides[currentSlide].subtitle}
              </h2>
            </div>

            {/* Bullet Points */}
            <div className="space-y-1">
              {slides[currentSlide].bulletPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.15 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span className="text-base text-gray-600">{point}</span>
                </motion.div>
              ))}
            </div>
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
