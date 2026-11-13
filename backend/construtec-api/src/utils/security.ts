import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { UserType } from '../models/types';

export const JWT_SECRET = process.env.JWT_SECRET || 'construtec_dev_jwt_secret_key';

export function hashPassword(plainText: string): string {
  if (!plainText) return '';
  return bcrypt.hashSync(plainText.trim(), 10);
}

export function verifyPassword(providedPassword: string, storedHash?: string): boolean {
  if (!providedPassword || !storedHash) return false;
  const clean = providedPassword.trim();

  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compareSync(clean, storedHash);
  }

  // Compatibilidade com hashes legados ou seed inicial
  const legacySha = crypto
    .createHash('sha256')
    .update(`construtec_unique_salt_${clean}`)
    .digest('hex');

  return storedHash === legacySha || clean === storedHash.trim();
}

export interface JwtUserPayload {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  role: string;
}

export function signJwtToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): JwtUserPayload {
  return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
}
