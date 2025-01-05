'use client';

import React, { useState } from 'react';
import { useZxing } from 'react-zxing';
import { Camera } from 'lucide-react';

export function BarcodeScanner() {
  const [isEnvironment, setIsEnvironment] = useState(true);

  const { ref } = useZxing({
    onDecodeResult(result) {
      const barcodeNumber = result.getText();
      // Vibrate device if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
      // Open beepscan URL in new window
      window.open(`https://www.beepscan.com/barcode/${barcodeNumber}`, '_blank');
    },
    onError(error) {
      console.error('Scan error:', error);
    },
    constraints: {
      video: {
        facingMode: isEnvironment ? 'environment' : 'user',
      },
    },
  });

  return (
    <div className="relative min-h-screen min-w-screen flex flex-col  overflow-hidden">
      {/* Scanner Section */}
      <div className="w-full aspect-square">
        <div className="relative w-full h-full">
          <div className="w-full h-full flex items-center justify-center bg-black relative">
            <video ref={ref} className="w-full h-full object-cover" />
            {/* Scanner Overlay */}
            <div className="absolute top-16 left-16 w-16 h-16 border-l-4 border-t-4 rounded-tl-3xl border-gray-300"></div>
            <div className="absolute top-16 right-16 w-16 h-16 border-r-4 border-t-4 rounded-tr-3xl border-gray-300"></div>
            <div className="absolute bottom-16 left-16 w-16 h-16 border-l-4 border-b-4 rounded-bl-3xl border-gray-300"></div>
            <div className="absolute bottom-16 right-16 w-16 h-16 border-r-4 border-b-4 rounded-br-3xl border-gray-300"></div>
            <div className="absolute top-24 left-0 right-0 text-center text-white text-sm">
              바코드를 사각형 안에 맞춰주세요
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 w-full px-6 pb-8 bg-white">
        <button className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium flex items-center justify-center gap-4">
          <Camera className="w-8 h-8" />
          <p>바코드 스캔하기</p>
        </button>
      </div>
    </div>
  );
}

export default BarcodeScanner;
