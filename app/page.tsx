import { redirect } from 'next/navigation';

import PricingDesk from '@/components/pricing-desk';
import { hasValidSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!(await hasValidSession())) {
    redirect('/login');
  }

  return <PricingDesk />;
}
