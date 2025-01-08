import { LoaderCircle } from 'lucide-react';

export default function MainLoading() {
  return (
    <div className="max-w-md h-screen mx-auto p-4  flex items-center justify-center gap-2">
      <LoaderCircle className="h-8 w-8 animate-spin" />
      <p className="text-xl">Processing...</p>
    </div>
  );
}
