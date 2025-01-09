'use client';

import { useState } from 'react';
import createSupabaseBrowserClient from '@/lib/supabse/client';

export const AD_FREE_HOURS = 8; // 광고 시청 후 무료 사용 시간
export const useAnalysisEligibility = (userId: string) => {
  const checkEligibility = async () => {
    const supabase = createSupabaseBrowserClient();

    const { data: user, error } = await supabase
      .from('userdata')
      .select('user_type, last_free_use, last_ad_view')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('사용자 정보 조회 실패:', error);
      return { canAnalyze: false, reason: 'error' };
    }

    // 1. 프리미엄 회원 체크
    if (user.user_type === 'premium') {
      return { canAnalyze: true };
    }

    // 2. 오늘의 무료 사용권 체크
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!user.last_free_use || new Date(user.last_free_use) < today) {
      return {
        canAnalyze: true,
        reason: 'daily_free',
      };
    }

    // 3. 광고 시청 후 8시간 이내인지 체크
    if (user.last_ad_view) {
      const lastView = new Date(user.last_ad_view);
      const hoursElapsed = (Date.now() - lastView.getTime()) / (1000 * 60 * 60);

      if (hoursElapsed < AD_FREE_HOURS) {
        return {
          canAnalyze: true,
          remainingHours: Math.floor(AD_FREE_HOURS - hoursElapsed),
        };
      }
    }

    // 4. 그 외의 경우 광고 시청 필요
    return {
      canAnalyze: false,
      reason: 'needs_ad',
    };
  };

  return { checkEligibility };
};
