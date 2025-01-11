//app/question/page.tsx

import React from 'react';
import QuestionSlidePage from './QuestionForm';
import { getUser } from '@/lib/supabse/server';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';

export default async function QuestionPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  const slide = typeof searchParams.slide === 'string' ? parseInt(searchParams.slide) : 0;

  return (
    <div>
      <QuestionSlidePage defaultSlide={slide} currentUser_id={currentUser_id} />
    </div>
  );
}
