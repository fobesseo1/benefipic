// app/SpeechToText.tsx
// components/SpeechToText.tsx
'use client';

import 'regenerator-runtime/runtime';
import React, { useEffect, useCallback, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface SpeechToTextProps {
  onTranscriptComplete: (transcript: string) => void;
}

const SpeechToText = ({ onTranscriptComplete }: SpeechToTextProps) => {
  const [mounted, setMounted] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  useEffect(() => {
    setMounted(true);
  }, []);

  let silenceTimer: NodeJS.Timeout;

  const handleStartListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: true,
      language: 'ko-KR',
    });
  };

  const handleStopListening = useCallback(() => {
    SpeechRecognition.stopListening();
    if (transcript.trim()) {
      onTranscriptComplete(transcript);
    }
  }, [transcript, onTranscriptComplete]);

  // 3초 무음 감지
  useEffect(() => {
    if (listening) {
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        handleStopListening();
      }, 3000);
    }

    return () => clearTimeout(silenceTimer);
  }, [transcript, listening, handleStopListening]);

  // 클라이언트 사이드 렌더링 전에는 아무것도 렌더링하지 않음
  if (!mounted) return null;

  if (!browserSupportsSpeechRecognition) {
    return <div>브라우저가 음성 인식을 지원하지 않습니다.</div>;
  }

  if (!isMicrophoneAvailable) {
    return <div>마이크 접근 권한이 필요합니다.</div>;
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={listening ? handleStopListening : handleStartListening}
        variant={listening ? 'destructive' : 'default'}
      >
        {listening ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
        {listening ? '중지' : '시작'}
      </Button>

      <div className="p-4 bg-gray-100 rounded-lg min-h-[100px]">
        {transcript || '음성을 입력해주세요...'}
      </div>
    </div>
  );
};

export default SpeechToText;
