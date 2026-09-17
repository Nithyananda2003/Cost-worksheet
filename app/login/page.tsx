import type { Metadata } from 'next';
import { Database, LockKeyhole, ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/app/login/login-form';
import { Badge } from '@/components/ui/badge';
import { hasValidSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign in | ADS Pricing Desk',
  description: 'Authorized access to the ADS Pricing Desk.',
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await hasValidSession()) {
    redirect('/');
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#f4f7f6] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#173a59] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 size-96 rounded-full bg-[#4ea68e]/20 blur-2xl" />
        <div className="absolute -bottom-36 -left-28 size-[28rem] rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <Database className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-heading font-semibold tracking-[-0.02em]">
              ADS Pricing Desk
            </p>
            <p className="text-xs text-white/55">Internal pricing workspace</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <Badge className="mb-6 border border-white/10 bg-white/10 text-[#d8eee8]">
            <ShieldCheck className="mr-1 size-3.5" aria-hidden="true" />
            Restricted access
          </Badge>
          <h1 className="font-heading text-5xl font-semibold leading-[1.05] tracking-[-0.045em]">
            Exact county pricing, kept within your team.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/65">
            Sign in to search the September 2025 ADS footprint matrix by state,
            county, service tier, and order type.
          </p>
        </div>

        <p className="relative text-xs text-white/40">
          Pricing data is served only after authentication.
        </p>
      </section>

      <section className="relative grid min-h-screen place-items-center px-5 py-10 sm:px-10">
        <div className="absolute left-5 top-5 flex items-center gap-2 lg:hidden">
          <div className="grid size-9 place-items-center rounded-xl bg-[#173a59] text-white">
            <Database className="size-[18px]" aria-hidden="true" />
          </div>
          <p className="font-heading text-sm font-semibold text-[#18314f]">
            ADS Pricing Desk
          </p>
        </div>

        <div className="w-full max-w-[25rem]">
          <div className="mb-7">
            <div className="mb-5 grid size-11 place-items-center rounded-2xl bg-[#dcece7] text-[#2f6f60]">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#3e7668]">
              Authorized users only
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.035em] text-[#18314f]">
              Sign in to continue
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Enter the credentials provided by your administrator.
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            Your session expires automatically after 8 hours.
          </p>
        </div>
      </section>
    </main>
  );
}
