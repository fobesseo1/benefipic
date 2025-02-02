import { getUser } from '@/lib/supabse/server';
import { isNewUser } from '@/utils/ad-utils';
import React from 'react';
import NoLoginUserAlert from '../components/shared/ui/NoLoginUserAlert';
import FaceAnalyzer from './FaceAnalyzer';

export default async function FacePage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  const newUserCheck = isNewUser(currentUser.created_at);
  //console.log(newUserCheck);

  if (!currentUser) {
    return <NoLoginUserAlert />;
  }

  return (
    <div className="pb-16 relative">
      <FaceAnalyzer currentUser_id={currentUser_id}  />
    </div>
  );
}
