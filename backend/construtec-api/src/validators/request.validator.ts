const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim().toLowerCase());
}

export function isValidPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 6;
}

export function isValidPositiveNumber(val: unknown): boolean {
  const num = Number(val);
  return Number.isFinite(num) && num > 0;
}

export function sanitizeString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val.trim() : fallback;
}
