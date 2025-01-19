// 'use client';

// import React, { useState, useRef, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Card } from '@/components/ui/card';
// import { compressImage, fileToBase64 } from '@/utils/image';
// import NutritionCard from '../components/shared/ui/NutritionCard';
// import Link from 'next/link';
// import { useAnalysisEligibility } from '../hooks/useAnalysisEligibility';
// import createSupabaseBrowserClient from '@/lib/supabse/client';
// import AdDialog from '../components/shared/ui/AdDialog';
// import {
//   ApiResponse,
//   calculateTotalNutrition,
//   findExactMatchFood,
//   NutritionData,
//   roundNutritionValues,
//   validateAndCorrectAnalysis,
// } from '@/utils/food-analysis';
// import { completedFoodDatabase } from '../food-description/foodDatabase';
// import NavigationButtonSectionMenu from '../components/shared/ui/NavigationButtonSectionMenu';

// type AnalysisStep =
//   | 'initial'
//   | 'camera'
//   | 'image-selected'
//   | 'compress'
//   | 'health-check'
//   | 'analyzing'
//   | 'calculate'
//   | 'complete';

// const getUserHealthProfile = async (userId: string) => {
//   const supabase = createSupabaseBrowserClient();
//   const { data, error } = await supabase
//     .from('health_records')
//     .select('*')
//     .eq('user_id', userId)
//     .order('created_at', { ascending: false })
//     .limit(1)
//     .single();

//   if (error) {
//     console.error('Health records 조회 실패:', error);
//     return null;
//   }

//   if (!data) return null;

//   const birthDate = new Date(data.birth_date);
//   const today = new Date();
//   const age = today.getFullYear() - birthDate.getFullYear();

//   return {
//     age,
//     gender: data.gender,
//     bmiStatus: data.bmi_status,
//     activityLevel: data.activity_level,
//     currentWeight: data.weight,
//     recommendedWeight: data.recommended_weight,
//     tdee: data.tdee,
//   };
// };

// const MenuAnalyzer = ({ currentUser_id }: { currentUser_id: string }) => {
//   const [step, setStep] = useState<AnalysisStep>('initial');
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [imageUrl, setImageUrl] = useState<string>('');
//   const [analysis, setAnalysis] = useState<NutritionData | null>(null);
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const [showAdDialog, setShowAdDialog] = useState(false);
//   const { checkEligibility } = useAnalysisEligibility(currentUser_id);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [displayImage, setDisplayImage] = useState<File | null>(null); // 고품질
//   const [analysisImage, setAnalysisImage] = useState<File | null>(null); // 저품질
//   const [filteredDisplayImage, setFilteredDisplayImage] = useState<File | null>(null); // 필터적용이미지

//   useEffect(() => {
//     return () => {
//       if (stream) {
//         stream.getTracks().forEach((track) => track.stop());
//       }
//     };
//   }, [stream]);

//   const processApiResponse = (apiData: ApiResponse): NutritionData => {
//     console.log('API 응답 데이터:', apiData);

//     // 정확한 매칭 확인
//     const exactMatch = findExactMatchFood(apiData.foodName, completedFoodDatabase);

//     // ingredients 형식 변환
//     const processedIngredients = apiData.ingredients.map((ingredient) => ({
//       name: ingredient.name,
//       amount: `${ingredient.amount.toString()}${ingredient.unit}`,
//       originalAmount: {
//         value: ingredient.amount,
//         unit: ingredient.unit,
//       },
//     }));

//     if (exactMatch) {
//       return {
//         foodName: apiData.foodName,
//         healthTip: apiData.healthTip,
//         ingredients: processedIngredients,
//         nutrition: exactMatch.nutrition,
//       };
//     }

//     // 보정 로직 적용
//     const correctedResult = validateAndCorrectAnalysis(apiData, completedFoodDatabase);
//     const totalNutrition = calculateTotalNutrition(correctedResult.ingredients);
//     const roundedNutrition = roundNutritionValues(totalNutrition);

//     return {
//       foodName: apiData.foodName,
//       healthTip: apiData.healthTip,
//       ingredients: processedIngredients,
//       nutrition: roundedNutrition,
//     };
//   };

//   const handleAdComplete = async () => {
//     const supabase = createSupabaseBrowserClient();
//     const { error } = await supabase
//       .from('userdata')
//       .update({
//         last_ad_view: new Date().toISOString(),
//       })
//       .eq('id', currentUser_id);

//     if (error) {
//       console.error('광고 시청 기록 실패:', error);
//       return;
//     }

//     setShowAdDialog(false);
//     analyzeImage();
//   };

//   const analyzeImage = async () => {
//     if (!analysisImage) return;

//     // 권한 체크
//     const eligibility = await checkEligibility();
//     if (!eligibility.canAnalyze) {
//       if (eligibility.reason === 'needs_ad') {
//         setShowAdDialog(true);
//         return;
//       }
//       return;
//     }

//     // 무료 사용 업데이트
//     if (eligibility.reason === 'daily_free') {
//       const supabase = createSupabaseBrowserClient();
//       const { error: updateError } = await supabase
//         .from('userdata')
//         .update({
//           last_free_use: new Date().toISOString(),
//         })
//         .eq('id', currentUser_id);

//       if (updateError) {
//         console.error('무료 사용 기록 실패:', updateError);
//         return;
//       }
//     }

//     try {
//       setStep('compress');
//       const base64Image = await fileToBase64(analysisImage);
//       const fileType = analysisImage.type === 'image/png' ? 'png' : 'jpeg';

//       // 사용자 건강 정보 가져오기
//       const healthProfile = await getUserHealthProfile(currentUser_id);
//       const userDescription = healthProfile
//         ? `
// 대상자 정보:
// - ${healthProfile.age}세 ${healthProfile.gender === 'female' ? '여성' : '남성'}
// - ${
//             healthProfile.bmiStatus === 'overweight' || healthProfile.bmiStatus === 'obese'
//               ? '체중 관리가 필요한'
//               : '건강한'
//           } 체형
// - 하루 필요 열량: ${healthProfile.tdee}kcal
// - 권장 체중: ${healthProfile.recommendedWeight}kg (현재 ${healthProfile.currentWeight}kg)
// - 활동량: ${healthProfile.activityLevel}`
//         : `
// 대상자 정보:
// - 일반적인 성인
// - 건강한 식단 관리 필요`;

//       setStep('analyzing');
//       const response = await fetch('https://api.openai.com/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
//         },
//         body: JSON.stringify({
//           model: 'gpt-4o-mini',
//           messages: [
//             {
//               role: 'system',
//               content: `당신은 음식 영양 분석 전문가입니다.
//               - 분석 대상:
//                 * 모든 섭취 가능한 음식과 음료
//                 * 포장된 식품/음료 제품
//                 * 물을 포함한 모든 음료
//                 * 영양소가 있거나 없더라도 인간이 섭취할 수 있는 모든 것

//               - 영양소 분석 지침:
//                 * 물의 경우도 영양소 0으로 기록하되 분석 대상에 포함
//                 * 포장 제품의 경우 영양성분표 기준으로 분석
//                 * 액체류도 100ml 기준으로 영양소 분석 진행

//               - isFood 판단 기준:
//                 * true: 모든 음식, 음료, 포장식품을 포함
//                 * false: 섭취 불가능한 물체나 비식품만 해당`,
//             },
//             {
//               role: 'user',
//               content: [
//                 {
//                   type: 'text',
//                   text: `이 음식 사진을 자세히 분석해주세요:

// ${userDescription}

// 필수 요구사항:
// 1. 반드시 사진에 있는 메뉴들 중에서만 선택할 것
// 2. 각 음식의 실제 양(g/ml)을 추정할 것
// 3. 재료별 영양정보를 상세히 분석할 것
// 4. 선택한 메뉴에 대해 다음 정보를 포함할 것:
//    - 대상자의 건강 상태와 필요 영양소를 고려한 추천 이유
//    - 재료별 정확한 양과 영양성분

// 다음 형식의 JSON으로 응답해주세요:
// {
//   "isFood": true,
//   "foodName": "선택한 메뉴 이름",
//   "healthTip": "개인별 맞춤 영양 조언",
//   "ingredients": [
//     {
//       "name": "재료명",
//       "amount": number,
//       "unit": "g 또는 ml",
//       "nutritionPer100g": {
//         "calories": number,
//         "protein": number,
//         "fat": number,
//         "carbs": number
//       }
//     }
//   ]
// }`,
//                 },
//                 {
//                   type: 'image_url',
//                   image_url: {
//                     url: `data:image/${fileType};base64,${base64Image}`,
//                   },
//                 },
//               ],
//             },
//           ],
//           max_tokens: 800,
//           temperature: 0.3,
//           response_format: { type: 'json_object' },
//         }),
//       });

//       const data = await response.json();
//       const parsedData = JSON.parse(data.choices[0].message.content);
//       const processedData = processApiResponse(parsedData);
//       setAnalysis(processedData);
//       setStep('complete');
//     } catch (error) {
//       console.error('Error:', error);
//       setAnalysis(null);
//       setStep('image-selected');
//     }
//   };
//   const resetAnalyzer = () => {
//     setStep('initial');
//     setSelectedImage(null);
//     setImageUrl('');
//     setAnalysis(null);
//   };

//   return (
//     <div className="relative min-h-screen min-w-screen flex flex-col bg-gray-900 overflow-hidden">
//       {/* Image Section */}
//       <div className="w-full aspect-square">
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={imageUrl}
//             initial={{ x: 160, opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             exit={{ x: -160, opacity: 0 }}
//             className="w-full aspect-square"
//           >
//             {step === 'camera' ? (
//               <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
//             ) : imageUrl ? (
//               <img src={imageUrl} alt="Selected food" className="w-full h-full object-cover" />
//             ) : (
//               <div className="w-full h-full flex items-center justify-center bg-black relative">
//                 {/* 모서리 프레임 */}
//                 <div className="absolute top-16 left-16 w-16 h-16 border-l-4 border-t-4 rounded-tl-3xl border-gray-300"></div>
//                 <div className="absolute top-16 right-16 w-16 h-16 border-r-4 border-t-4 rounded-tr-3xl border-gray-300"></div>
//                 <div className="absolute bottom-16 left-16 w-16 h-16 border-l-4 border-b-4 rounded-bl-3xl border-gray-300"></div>
//                 <div className="absolute bottom-16 right-16 w-16 h-16 border-r-4 border-b-4 rounded-br-3xl border-gray-300"></div>

//                 {/* 안내 텍스트 */}
//                 <span className="text-gray-500">메뉴 사진을 선택해주세요</span>
//               </div>
//             )}
//           </motion.div>
//         </AnimatePresence>
//       </div>

//       {/* Content Section */}
//       <div
//         className={`absolute bottom-0 w-full ${
//           step === 'complete'
//             ? 'h-[calc(100vh-50vw+32px)] py-8 pb-32'
//             : 'h-[calc(100vh-100vw+32px)] py-8'
//         } flex flex-col px-6  rounded-t-3xl bg-white`}
//       >
//         <div className="flex-1 overflow-y-auto">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={step}
//               initial={{ x: 300, opacity: 0 }}
//               animate={{ x: 0, opacity: 1 }}
//               exit={{ x: -300, opacity: 0 }}
//               className="flex-1 flex flex-col"
//             >
//               {step === 'analyzing' && (
//                 <div className="flex flex-col items-center justify-center h-full">
//                   <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black" />
//                   <p className="mt-4 text-gray-500">메뉴를 분석하고 있어요...</p>
//                 </div>
//               )}

//               {(step === 'complete' || step === 'image-selected') && analysis && (
//                 <div className="flex-1 overflow-y-auto space-y-6">
//                   {/* Name Card */}
//                   <Card className="p-4">
//                     <div className="grid grid-cols-1 gap-2 h-16">
//                       <div className="col-span-1 py-2 flex items-center">
//                         <p className="font-medium text-xl">{analysis.foodName}</p>
//                       </div>
//                     </div>
//                   </Card>

//                   {/* Nutrition Card */}
//                   <NutritionCard nutrition={analysis.nutrition} />

//                   {/* healthTip Card */}
//                   <Card className="p-4">
//                     <h3 className="text-lg font-semibold mb-3">건강 꿀팁</h3>
//                     <div className="grid grid-cols-1 gap-3">
//                       {/* 건강 꿀팁 내용 */}
//                       <p>{analysis.healthTip}</p>
//                     </div>
//                   </Card>
//                 </div>
//               )}
//             </motion.div>
//           </AnimatePresence>
//         </div>
//       </div>

//       {/* Navigation Section */}
//       {step === 'complete' ? (
//         <div className="absolute bottom-0 w-full px-6 pb-8 bg-white">
//           <div className="grid grid-cols-2 gap-4">
//             <Link
//               href="/"
//               className="w-full bg-gray-100 text-gray-900 rounded-xl py-4 text-lg font-medium text-center"
//             >
//               홈으로
//             </Link>
//             <button
//               onClick={() => {
//                 setStep('initial');
//                 setSelectedImage(null);
//                 setImageUrl('');
//                 setAnalysis(null);
//               }}
//               className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
//             >
//               다시하기
//             </button>
//           </div>
//         </div>
//       ) : (
//         <NavigationButtonSectionMenu
//           step={step}
//           setStep={setStep}
//           setSelectedImage={setSelectedImage}
//           setAnalysisImage={setAnalysisImage}
//           setDisplayImage={setDisplayImage}
//           setImageUrl={setImageUrl}
//           onAnalyze={analyzeImage}
//         resetAnalyzer={resetAnalyzer}

//         />
//       )}

//       {/* 광고 알림 */}
//       <AdDialog
//         isOpen={showAdDialog}
//         onClose={() => setShowAdDialog(false)}
//         onAdComplete={handleAdComplete}
//       />
//     </div>
//   );
// };

// export default MenuAnalyzer;
