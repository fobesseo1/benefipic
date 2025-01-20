export const isNewUser = (createdAt: string): boolean => {
  // KST(한국 시간)로 보정
  const KST_OFFSET = 9 * 60 * 60 * 1000; // 9시간을 밀리초로 변환

  const created = new Date(createdAt).getTime() + KST_OFFSET;
  const now = Date.now() + KST_OFFSET;

  // 15일을 밀리초로 변환 (15 * 24시간 * 60분 * 60초 * 1000밀리초)
  const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;

  return now - created <= FIFTEEN_DAYS;
};
