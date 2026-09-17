import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const metadataBase = new URL(
  productionHost ? `https://${productionHost}` : 'http://localhost:3000',
);

export const metadata: Metadata = {
  metadataBase,
  title: 'ADS Pricing Desk',
  description:
    'Look up ADS county order prices, adjust additional costs, and download a completed cost worksheet.',
  openGraph: {
    title: 'ADS Pricing Desk',
    description:
      'Exact county pricing with editable cost worksheet PDF downloads.',
    type: 'website',
    images: [
      { url: '/og.png', width: 1200, height: 630, alt: 'ADS Pricing Desk' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ADS Pricing Desk',
    description:
      'Exact county pricing with editable cost worksheet PDF downloads.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
