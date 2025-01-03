//lib/utils/dateAudit.ts

// export const getKoreanDateRange = () => {
//   const now = new Date();
//   const kstStart = new Date(now.getTime() + 9 * 60 * 60 * 1000);
//   kstStart.setHours(0, 0, 0, 0);
//   const kstEnd = new Date(now.getTime() + 9 * 60 * 60 * 1000);
//   kstEnd.setHours(23, 59, 59, 999);

//   const utcStart = new Date(kstStart.getTime() - 9 * 60 * 60 * 1000);
//   const utcEnd = new Date(kstEnd.getTime() - 9 * 60 * 60 * 1000);

//   return { utcStart, utcEnd };
// };

export const getKoreanDateRange = (date: Date = new Date()) => {
  // 입력받은 날짜를 KST 기준으로 변환
  const kstStart = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  kstStart.setHours(0, 0, 0, 0);
  const kstEnd = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  kstEnd.setHours(23, 59, 59, 999);

  // KST를 UTC로 변환
  const utcStart = new Date(kstStart.getTime() - 9 * 60 * 60 * 1000);
  const utcEnd = new Date(kstEnd.getTime() - 9 * 60 * 60 * 1000);

  return { utcStart, utcEnd };
};
