import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function MobileOnlyMessage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-2xl font-bold">모바일에서 이용해주세요</h1>
        <p className="text-gray-600">
          Benefipic은 사진 촬영 기능이 필요한 모바일 전용 서비스입니다. 더 나은 경험을 위해
          스마트폰으로 접속해주세요.
        </p>
        <div className="flex justify-center p-4 bg-white rounded-lg shadow-sm">
          <QRCodeSVG
            value="https://benefipic.vercel.app"
            size={180}
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="text-sm text-gray-500">QR코드를 스캔하여 모바일에서 바로 접속하세요</p>
      </div>
    </div>
  );
}
