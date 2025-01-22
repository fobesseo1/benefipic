// app/SpeechToText.tsx
'use client';

import 'regenerator-runtime';
import React, { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SpeechToText = () => {
  const [isSupported, setIsSupported] = useState(true);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  useEffect(() => {
    setIsSupported(browserSupportsSpeechRecognition);
  }, [browserSupportsSpeechRecognition]);

  const startListening = () => {
    SpeechRecognition.startListening({
      continuous: true,
      language: 'ko-KR', // BCP 47 language tag for Korean
    });
  };

  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          죄송합니다. 현재 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isMicrophoneAvailable) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          음성 인식
          <span className="text-sm font-normal">마이크 상태: {listening ? '켜짐' : '꺼짐'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            onClick={listening ? SpeechRecognition.stopListening : startListening}
            variant={listening ? 'destructive' : 'default'}
          >
            {listening ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                중지
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                시작
              </>
            )}
          </Button>
          <Button onClick={resetTranscript} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
        </div>

        <div className="min-h-32 p-4 bg-muted rounded-lg">
          {transcript || '음성을 입력해주세요...'}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeechToText;
