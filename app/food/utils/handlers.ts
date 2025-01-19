// /app/food/utils/handlers.ts

import { Dispatch, SetStateAction, ChangeEvent } from 'react';

// 수량 증가 핸들러
export const handleIncrease = (
  quantity: number,
  setQuantity: Dispatch<SetStateAction<number>>
): void => {
  if (quantity < 99) setQuantity((prev) => prev + 1);
};

// 수량 감소 핸들러
export const handleDecrease = (
  quantity: number,
  setQuantity: Dispatch<SetStateAction<number>>
): void => {
  if (quantity > 1) setQuantity((prev) => prev - 1);
};

// 수량 입력 핸들러
export const handleInputChange = (
  e: ChangeEvent<HTMLInputElement>,
  setQuantity: Dispatch<SetStateAction<number>>
): void => {
  const value = parseInt(e.target.value);
  if (!isNaN(value)) {
    if (value > 99) setQuantity(99);
    else if (value < 1) setQuantity(1);
    else setQuantity(value);
  }
};
