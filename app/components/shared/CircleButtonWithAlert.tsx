'use client';

import { Camera, Plus, X } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Link from 'next/link';

export default function CircleButtonWithAlert() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <div
          className="bg-gray-900 w-12 h-12 flex items-center justify-center rounded-full cursor-pointer shadow-md"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="w-10 h-10 text-white" />
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md ">
        <div className="flex justify-end ">
          <Button
            variant="ghost"
            className="w-6 h-6 p-0 border-[1px] border-gray-400 rounded-full"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/food" onClick={() => setIsOpen(false)}>
            <Button variant="outline" className="w-full p-6">
              사진입력
            </Button>
          </Link>
          <Link href="/barcode" onClick={() => setIsOpen(false)}>
            <Button variant="outline" className="w-full p-6">
              바코드
            </Button>
          </Link>
          <Link href="/food-description" onClick={() => setIsOpen(false)}>
            <Button variant="outline" className="w-full p-6">
              직접입력
            </Button>
          </Link>
          <Link href="/exercise" onClick={() => setIsOpen(false)}>
            <Button variant="outline" className="w-full p-6">
              운동입력
            </Button>
          </Link>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
