'use client';

import { useEffect } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    console.log(
      '%cSegura aí, campeão!',
      'color: #ff5733; font-size: 40px; font-weight: bold; text-shadow: 2px 2px 4px #000000;'
    );
    console.log(
      '%c@magicuzin',
      'font-size: 16px;'
    );
     console.log(
      '%chttps://instagram.com/magicuzin',
      'font-size: 16px; font-weight: bold; color: red;'
    );
  }, []);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Centro de Recarga Free Fire</title>
        <meta name="description" content="O site oficial para comprar diamantes no Free Fire. Vários métodos de pagamento estão disponíveis para os jogadores do Brasil." />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
