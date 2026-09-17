import { NextResponse } from 'next/server';

import {
  createSessionToken,
  isAuthConfigured,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  validateCredentials,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          'Login is not configured. Add the required Vercel environment variables.',
      },
      { status: 503 },
    );
  }

  const username =
    typeof body === 'object' && body !== null && 'username' in body
      ? (body as { username?: unknown }).username
      : null;
  const password =
    typeof body === 'object' && body !== null && 'password' in body
      ? (body as { password?: unknown }).password
      : null;

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !validateCredentials(username.trim(), password)
  ) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.json(
      { error: 'The username or password is incorrect.' },
      { status: 401 },
    );
  }

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json(
      { error: 'Login is unavailable.' },
      { status: 503 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
