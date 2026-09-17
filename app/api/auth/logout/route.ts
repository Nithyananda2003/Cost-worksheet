import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
