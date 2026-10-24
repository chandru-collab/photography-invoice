import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Photography Studio Quotation & Invoice Pro',
  description: 'Professional Quotation & Invoice Generator for Wedding, Commercial & Portrait Photography Studios',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden" suppressHydrationWarning>
        <Suspense fallback={<div className="h-16 bg-zinc-950" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
      </body>
    </html>
  );
}
