import { BadRequestException } from '@nestjs/common';

export function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

export function normalizeIranMobile(value: unknown) {
  let mobile = latinDigits(String(value ?? '')).replace(/\D/g, '');
  if (mobile.startsWith('0098')) mobile = '0' + mobile.slice(4);
  else if (mobile.startsWith('98')) mobile = '0' + mobile.slice(2);

  if (!/^09\d{9}$/.test(mobile)) {
    throw new BadRequestException('Enter a valid Iranian mobile number');
  }
  return mobile;
}

export function tryNormalizeIranMobile(value: unknown) {
  try {
    return normalizeIranMobile(value);
  } catch {
    return null;
  }
}
