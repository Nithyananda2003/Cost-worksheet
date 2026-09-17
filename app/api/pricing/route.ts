import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

import { hasValidSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let catalogPromise: Promise<string> | null = null;

function loadCatalog() {
  // Read changes immediately during local pricing updates; production is
  // immutable per deployment and can safely reuse its catalog promise.
  if (process.env.NODE_ENV !== 'production') {
    return readFile(
      path.join(process.cwd(), 'data', 'pricing-data.json'),
      'utf8',
    );
  }
  catalogPromise ??= readFile(
    path.join(process.cwd(), 'data', 'pricing-data.json'),
    'utf8',
  );
  return catalogPromise;
}

export async function GET() {
  if (!(await hasValidSession())) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    );
  }

  try {
    const catalog = await loadCatalog();
    return new NextResponse(catalog, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    catalogPromise = null;
    return NextResponse.json(
      { error: 'Pricing data could not be loaded.' },
      { status: 500 },
    );
  }
}
