export default function Offline() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">오프라인 상태입니다</h1>
        <p className="text-gray-600">인터넷 연결이 불안정합니다. 연결을 확인해주세요.</p>
        <p className="text-sm text-gray-500">이전에 열어본 페이지는 오프라인에서도 볼 수 있어요.</p>
      </div>
    </div>
  );
}
