import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'ads_price_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function configuredValue(
  name: 'AUTH_USERNAME' | 'AUTH_PASSWORD' | 'AUTH_SECRET',
) {
  const value = process.env[name];
  return value && value.length > 0 ? value : null;
}

export function isAuthConfigured() {
  return Boolean(
    configuredValue('AUTH_USERNAME') &&
    configuredValue('AUTH_PASSWORD') &&
    configuredValue('AUTH_SECRET'),
  );
}

function constantTimeEqual(candidate: string, expected: string) {
  const candidateHash = createHash('sha256').update(candidate).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export function validateCredentials(username: string, password: string) {
  const expectedUsername = configuredValue('AUTH_USERNAME');
  const expectedPassword = configuredValue('AUTH_PASSWORD');

  if (!expectedUsername || !expectedPassword) return false;

  return (
    constantTimeEqual(username, expectedUsername) &&
    constantTimeEqual(password, expectedPassword)
  );
}

function sign(payload: string) {
  const secret = configuredValue('AUTH_SECRET');
  if (!secret) return null;
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken() {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `v1.${expiresAt}`;
  const signature = sign(payload);
  if (!signature) return null;
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  const expectedSignature = sign(payload);
  if (!expectedSignature) return false;

  return constantTimeEqual(parts[2], expectedSignature);
}

export async function hasValidSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
