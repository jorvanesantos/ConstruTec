import { createHmac, timingSafeEqual } from 'node:crypto';
import { CalculationResult } from '../models/types';
import { JWT_SECRET } from './security';

type SignedCalculation = CalculationResult & {
  signature?: string;
  formValues?: unknown;
  location?: unknown;
};

function digest(result: SignedCalculation, userId: string, version: 1 | 2): Buffer {
  const { signature: _signature, formValues: _formValues, location: _location, ...calculation } = result;
  const serialized = version === 1
    ? JSON.stringify(calculation)
    : JSON.stringify(calculation, (_key, value: unknown) =>
        value && typeof value === 'object' && !Array.isArray(value)
          ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
          : value
      );
  return createHmac('sha256', JWT_SECRET)
    .update(`construtec-calculation-v${version}\0`)
    .update(userId)
    .update('\0')
    .update(serialized)
    .digest();
}

export function signCalculation(result: CalculationResult, userId: string): SignedCalculation {
  return { ...result, signature: digest(result, userId, 2).toString('hex') };
}

export function verifyCalculation(result: SignedCalculation, userId: string): boolean {
  if (typeof result.signature !== 'string' || !/^[a-f0-9]{64}$/.test(result.signature)) return false;
  const provided = Buffer.from(result.signature, 'hex');
  return timingSafeEqual(provided, digest(result, userId, 2)) ||
    timingSafeEqual(provided, digest(result, userId, 1));
}
