// //app/food/FoodAnalyzer.tsx

// 'use client';

// import React, { useState, useRef, useEffect } from 'react';
// import { Minus, Pencil, Plus } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Card } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { applyFiltersAndSave, compressImage, fileToBase64 } from '@/utils/image';
// import NutritionCard from '../components/shared/ui/NutritionCard';
// import NavigationButtonSection from '../components/shared/ui/NavigationButtonSection';
// import createSupabaseBrowserClient from '@/lib/supabse/client';
// import { useRouter } from 'next/navigation';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from '@/components/ui/alert-dialog';
// import AnalysisProgress from './AnalysisProgress';
// import FoodDetectionAlert from './FoodDetectionAlert';
// import { completedFoodDatabase, ingredientDatabase } from '../food-description/foodDatabase';
// import { useAnalysisEligibility } from '../hooks/useAnalysisEligibility';
// import AdDialog from '../components/shared/ui/AdDialog';
// import { Button } from '@/components/ui/button';
// import {
//   ApiResponse,
//   calculateTotalNutrition,
//   findExactMatchFood,
//   FoodAnalysis,
//   Ingredient,
//   NutritionData,
//   NutritionPer100g,
//   roundNutritionValues,
//   validateAndCorrectAnalysis,
// } from '@/utils/food-analysis';
// import FoodImageFilter from '../components/shared/ui/FoodImageFilter';

// // 타입 정의
// type AnalysisStep =
//   | 'initial'
//   | 'camera'
//   | 'image-selected'
//   | 'filter-selection'
//   | 'compress'
//   | 'analyzing'
//   | 'calculate'
//   | 'health-check'
//   | 'complete';

// // 메인 컴포넌트
// const FoodAnalyzer = ({ currentUser_id }: { currentUser_id: string }) => {
//   const [step, setStep] = useState<AnalysisStep>('initial');
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [imageUrl, setImageUrl] = useState<string>('');
//   const [analysis, setAnalysis] = useState<NutritionData | null>(null);
//   const [originalAnalysis, setOriginalAnalysis] = useState<NutritionData | null>(null);
//   const [quantity, setQuantity] = useState(1);
//   const [showResultAlert, setShowResultAlert] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [editMode, setEditMode] = useState({
//     foodName: false,
//   });
//   const [notFoodAlert, setNotFoodAlert] = useState({
//     isOpen: false,
//     detectedContent: '',
//   });
//   const [showAdDialog, setShowAdDialog] = useState(false);
//   const { checkEligibility } = useAnalysisEligibility(currentUser_id);

//   const [displayImage, setDisplayImage] = useState<File | null>(null); // 고품질
//   const [analysisImage, setAnalysisImage] = useState<File | null>(null); // 저품질

//   const router = useRouter();
//   const supabase = createSupabaseBrowserClient();

//   const handleAdComplete = async () => {
//     const supabase = createSupabaseBrowserClient();

//     // 광고 시청 시간 업데이트
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
//     analyzeImage(); // 분석 재시작
//   };

//   // Effect Hooks
//   useEffect(() => {
//     if (originalAnalysis) {
//       setAnalysis(calculateNutritionByQuantity(originalAnalysis, quantity));
//     }
//   }, [quantity, originalAnalysis]);

//   // 이벤트 핸들러
//   const handleIncrease = () => {
//     if (quantity < 99) setQuantity((prev) => prev + 1);
//   };

//   const handleDecrease = () => {
//     if (quantity > 1) setQuantity((prev) => prev - 1);
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = parseInt(e.target.value);
//     if (!isNaN(value)) {
//       if (value > 99) setQuantity(99);
//       else if (value < 1) setQuantity(1);
//       else setQuantity(value);
//     }
//   };

//   const closeNotFoodAlert = () => {
//     setNotFoodAlert({
//       isOpen: false,
//       detectedContent: '',
//     });
//   };

//   // 계산 함수들
//   const calculateNutritionByQuantity = (
//     originalData: NutritionData,
//     qty: number
//   ): NutritionData => {
//     return {
//       ...originalData,
//       nutrition: {
//         calories: Math.round(originalData.nutrition.calories * qty),
//         protein: parseFloat((originalData.nutrition.protein * qty).toFixed(1)),
//         fat: parseFloat((originalData.nutrition.fat * qty).toFixed(1)),
//         carbs: parseFloat((originalData.nutrition.carbs * qty).toFixed(1)),
//       },
//       ingredients: originalData.ingredients.map((ingredient) => {
//         if (ingredient.originalAmount) {
//           return {
//             ...ingredient,
//             amount: `${(ingredient.originalAmount.value * qty).toFixed(1)}${
//               ingredient.originalAmount.unit
//             }`,
//           };
//         }
//         return ingredient;
//       }),
//     };
//   };

//   const processApiResponse = (apiData: ApiResponse): NutritionData => {
//     console.log('API 응답 데이터:', apiData);

//     // 정확한 매칭 확인
//     const exactMatch = findExactMatchFood(apiData.foodName, completedFoodDatabase);

//     // ingredients 형식 변환 (항상 OpenAI 결과 사용)
//     const processedIngredients = apiData.ingredients.map((ingredient) => ({
//       name: ingredient.name,
//       amount: `${ingredient.amount.toString()}${ingredient.unit}`,
//       originalAmount: {
//         value: ingredient.amount,
//         unit: ingredient.unit,
//       },
//     }));

//     if (exactMatch) {
//       // 정확히 일치하는 경우 DB의 영양정보 직접 사용
//       return {
//         foodName: apiData.foodName,
//         ingredients: processedIngredients,
//         nutrition: exactMatch.nutrition, // DB 값 그대로 사용
//       };
//     }

//     // 일치하지 않는 경우 기존 로직대로 계산
//     const totalNutrition = calculateTotalNutrition(apiData.ingredients);
//     const roundedNutrition = roundNutritionValues(totalNutrition);

//     return {
//       foodName: apiData.foodName,
//       ingredients: processedIngredients,
//       nutrition: roundedNutrition,
//     };
//   };

//   // API 통신

//   const analyzeImage = async () => {
//     if (!analysisImage) return;

//     // 권한 체크
//     const supabase = createSupabaseBrowserClient();
//     const { checkEligibility } = useAnalysisEligibility(currentUser_id);

//     // 권한 체크
//     const eligibility = await checkEligibility();

//     if (!eligibility.canAnalyze) {
//       if (eligibility.reason === 'needs_ad') {
//         setShowAdDialog(true);
//         return;
//       }
//       return;
//     }

//     // 오늘의 무료 사용인 경우, last_free_use 업데이트
//     if (eligibility.reason === 'daily_free') {
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
//                 * false: 섭취 불가능한 물체나 비식품만 해당

//               - foodName 음식이름 기준 :
//                 * 완성된 음식이 두 개이상 보일경우 (예시: 햄버거, 감자튀김, 콜라) 이경우에는 반드시 힘식이름을 햄버거와 감자튀김 그리고 콜라와 같은 식으로 만들어

//               주의: 음료도 식품으로 간주하여 isFood를 true로 설정해야 합니다.`,
//             },
//             {
//               role: 'user',
//               content: [
//                 {
//                   type: 'text',
//                   text: `이 음식 사진을 자세히 분석해주세요. 다음 사항들을 고려해주세요:
//                   - 음식뿐만 아니라 음료도 분석 대상입니다
//   - 포장된 제품의 경우 영양성분표를 기준으로 분석해주세요
//                   - 음식의 양을 추정할 때는 식기나 주변 사물의 크기를 기준으로 삼아주세요
//                   - 반드시 사진에 있는 모든 음식을 고려해주세요
//                   - 인분 수뿐만 아니라 실제 중량이나 부피도 반드시 추정해주세요
//                   - 다만 예외적으로, 음식이 아닐 경우 어떤 이미지인지 아주 간단히 description 항목에 남겨주세요

//                   다음 형식의 JSON으로 응답해주세요:
//                   {
//                     "isFood": true/false,
//                     "foodName": "음식 이름(반드시 한글로 작성해)",
//                     "description": "음식이 아닐 경우 설명",
//                     "ingredients": [
//                       {
//                         "name": "재료명",
//                         "amount": number,
//                         "unit": "g 또는 ml",
//                         "nutritionPer100g": {
//                           "calories": number,
//                           "protein": number,
//                           "fat": number,
//                           "carbs": number
//                         }
//                       }
//                     ]
//                   }`,
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
//       const result = JSON.parse(data.choices[0].message.content) as ApiResponse;
//       console.log('분석 결과:', result);

//       if (!result.isFood) {
//         setNotFoodAlert({
//           isOpen: true,
//           detectedContent: result.description || '음식이 아닌 것으로 판단됩니다.',
//         });
//         setStep('image-selected');
//         return;
//       }

//       // 분석 결과 보정
//       const correctedResult = validateAndCorrectAnalysis(result, completedFoodDatabase);

//       const processedData = processApiResponse(correctedResult);
//       setOriginalAnalysis(processedData);
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
//     setOriginalAnalysis(null);
//     setQuantity(1);
//   };

//   const successSave = () => {
//     router.push('/main');
//     return null;
//   };

//   const saveFoodLog = async () => {
//     const imageToSave = displayImage;
//     if (!imageToSave || !analysis) return;

//     try {
//       const fileExt = imageToSave.type.split('/')[1];
//       const filePath = `${currentUser_id}/${Date.now()}.${fileExt}`;

//       const { data: uploadData, error: uploadError } = await supabase.storage
//         .from('food-images')
//         .upload(filePath, imageToSave);

//       if (uploadError) throw uploadError;

//       const {
//         data: { publicUrl },
//       } = supabase.storage.from('food-images').getPublicUrl(filePath);

//       const { error: insertError } = await supabase.from('food_logs').insert({
//         user_id: currentUser_id,
//         logged_at: new Date().toISOString(),
//         food_name: analysis.foodName,
//         image_url: publicUrl,
//         calories: analysis.nutrition.calories,
//         protein: analysis.nutrition.protein,
//         fat: analysis.nutrition.fat,
//         carbs: analysis.nutrition.carbs,
//       });

//       if (insertError) throw insertError;

//       setError(null);
//       setShowResultAlert(true);
//     } catch (error) {
//       console.error('Error saving food log:', error);
//       setError('저장 중 오류가 발생했습니다.');
//       setShowResultAlert(true);
//     }
//   };

//   // 렌더링
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
//             {imageUrl ? (
//               <img src={imageUrl} alt="Selected food" className="w-full h-full object-cover" />
//             ) : (
//               <div className="w-full h-full flex items-center justify-center bg-black relative">
//                 {/* 모서리 프레임 */}
//                 <div className="absolute top-16 left-16 w-16 h-16 border-l-4 border-t-4 rounded-tl-3xl border-gray-300"></div>
//                 <div className="absolute top-16 right-16 w-16 h-16 border-r-4 border-t-4 rounded-tr-3xl border-gray-300"></div>
//                 <div className="absolute bottom-16 left-16 w-16 h-16 border-l-4 border-b-4 rounded-bl-3xl border-gray-300"></div>
//                 <div className="absolute bottom-16 right-16 w-16 h-16 border-r-4 border-b-4 rounded-br-3xl border-gray-300"></div>

//                 <span className="text-gray-500">음식 사진을 선택해주세요</span>
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
//               {(step === 'compress' || step === 'analyzing' || step === 'calculate') && (
//                 <div className="flex flex-col items-center justify-center h-full tracking-tighter">
//                   <AnalysisProgress currentStep={step} />
//                   <p className="mt-8 text-gray-500 whitespace-pre-line">
//                     {step === 'compress' && '이미지를 최적화하고 있어요...'}
//                     {step === 'analyzing' &&
//                       `사진을 자세히 살펴보고 있어요\n조금만 기다려주시면 곧 분석이 완료돼요🔍
//                       \n다양한 음식 또는 다른 물건들이 있다면\n조금더 시간이 필요해요^^`}
//                     {step === 'calculate' && '영양소를 계산하고 있어요...'}
//                   </p>
//                 </div>
//               )}

//               {(step === 'complete' || step === 'image-selected') && analysis && (
//                 <div className="flex-1 overflow-y-auto space-y-6">
//                   {/* Name & Number Card */}
//                   <Card className="p-4">
//                     <div className="grid grid-cols-10 gap-2 h-16">
//                       <div className="col-span-6 py-2 flex items-center">
//                         {editMode.foodName ? (
//                           <Input
//                             type="text"
//                             value={analysis.foodName}
//                             onChange={(e) => {
//                               setAnalysis((prev) =>
//                                 prev
//                                   ? {
//                                       ...prev,
//                                       foodName: e.target.value,
//                                     }
//                                   : null
//                               );
//                             }}
//                             onBlur={() => setEditMode((prev) => ({ ...prev, foodName: false }))}
//                             className="text-xl font-medium"
//                             autoFocus
//                           />
//                         ) : (
//                           <div className="flex items-center gap-2">
//                             <p className="font-medium text-xl line-clamp-2">{analysis.foodName}</p>
//                             <button
//                               onClick={() => setEditMode((prev) => ({ ...prev, foodName: true }))}
//                               className="p-1 hover:bg-gray-200 rounded-full transition-colors"
//                             >
//                               <Pencil className="w-4 h-4 text-gray-500" />
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                       <div className="col-span-4 py-2">
//                         <div className="flex items-center justify-between h-full">
//                           <button
//                             onClick={handleDecrease}
//                             className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
//                             disabled={quantity <= 1}
//                           >
//                             <Minus size={16} />
//                           </button>

//                           <input
//                             type="number"
//                             value={quantity}
//                             onChange={handleInputChange}
//                             min="1"
//                             max="99"
//                             className="w-12 h-12 text-center bg-white rounded-lg text-xl font-semibold"
//                           />

//                           <button
//                             onClick={handleIncrease}
//                             className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
//                             disabled={quantity >= 99}
//                           >
//                             <Plus size={16} />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   </Card>

//                   {/* Nutrition Card */}
//                   <NutritionCard
//                     nutrition={analysis.nutrition}
//                     onNutritionChange={(newNutrition) => {
//                       setAnalysis((prev) =>
//                         prev
//                           ? {
//                               ...prev,
//                               nutrition: newNutrition,
//                             }
//                           : null
//                       );
//                     }}
//                     editable={true}
//                   />

//                   {/* Ingredients Card */}
//                   <Card className="p-4">
//                     <h3 className="text-lg font-semibold mb-3">재료 구성</h3>
//                     <div className="grid grid-cols-2 gap-3">
//                       {analysis.ingredients.map((ingredient, index) => (
//                         <div key={index} className="bg-gray-50 p-3 rounded-lg shadow-md">
//                           <p className="font-medium">{ingredient.name}</p>
//                           <p className="text-sm text-gray-600">{ingredient.amount}</p>
//                         </div>
//                       ))}
//                     </div>
//                   </Card>
//                 </div>
//               )}
//             </motion.div>
//           </AnimatePresence>
//         </div>
//       </div>

//       {/* Navigation Section */}
//       <NavigationButtonSection
//         step={step}
//         setStep={setStep}
//         setSelectedImage={setSelectedImage}
//         setAnalysisImage={setAnalysisImage}
//         setDisplayImage={setDisplayImage}
//         setImageUrl={setImageUrl}
//         onAnalyze={analyzeImage}
//         onSave={saveFoodLog}
//         resetAnalyzer={resetAnalyzer}
//       />

//       {/* 저장 결과 Alert */}
//       <AlertDialog open={showResultAlert} onOpenChange={setShowResultAlert}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>{error ? '저장 실패' : '저장 완료'}</AlertDialogTitle>
//             <AlertDialogDescription>
//               {error ? error : '음식 정보가 성공적으로 저장되었습니다.'}
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <Button onClick={successSave} className="p-6">
//               확인
//             </Button>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {/* 음식 아닌 이미지 경고 알림 */}
//       <FoodDetectionAlert
//         isOpen={notFoodAlert.isOpen}
//         onClose={closeNotFoodAlert}
//         detectedContent={notFoodAlert.detectedContent}
//       />
//       {/* 광고 알림 */}
//       <AdDialog
//         isOpen={showAdDialog}
//         onClose={() => setShowAdDialog(false)}
//         onAdComplete={handleAdComplete}
//       />
//     </div>
//   );
// };

// export default FoodAnalyzer;
