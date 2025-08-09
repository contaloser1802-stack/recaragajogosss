'use client';

import { useEffect } from 'react';
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
      '%cNão adianta tentar me clonar, eu sou o 00 e você nunca será o 01',
      'font-size: 16px; font-weight: bold; color: red;'
    );
     console.log(
      '%chttps://instagram.com/magicuzin',
      'font-size: 16px;'
    );
  }, []);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Centro de Recarga Free Fire</title>
        <meta name="description" content="O site oficial para comprar diamantes no Free Fire. Vários métodos de pagamento estão disponíveis para os jogadores do Brasil." />
        
        <script dangerouslySetInnerHTML={{ __html: `
          window.pixelId = "68652c2603b34a13ee47f2dd";
          var a = document.createElement("script");
          a.setAttribute("async", "");
          a.setAttribute("defer", "");
          a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
          document.head.appendChild(a);
        `}} />

        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-xcod-sck
          data-utmify-prevent-subids
          async
          defer
        ></script>

        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17448187029"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17448187029');
        `}} />

        {/* Meta Pixel Code */}
        <script dangerouslySetInnerHTML={{ __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1264486768354584');
          fbq('track', 'PageView');
        `}} />
        <noscript>
          <img height="1" width="1" style={{display: 'none'}}
               src="https://www.facebook.com/tr?id=1264486768354584&ev=PageView&noscript=1"
          />
        </noscript>
        {/* End Meta Pixel Code */}

      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
