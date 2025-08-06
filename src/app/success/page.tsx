'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    utm_pixel?: {
      track: (eventName: string) => void;
    };
    fbq?: (
      type: 'track',
      eventName: string,
      params?: { [key: string]: any }
    ) => void;
  }
}

export default function SuccessPage() {
  const { toast } = useToast();
  const [avatarIcon, setAvatarIcon] = useState('https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png');

  useEffect(() => {
    try {
      const storedAppId = localStorage.getItem('selectedAppId');
      if (storedAppId === '100151') {
          setAvatarIcon('https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png');
      }

      // Limpa dados de transação e cliente
      localStorage.removeItem('paymentData');
      localStorage.removeItem('customerData');
      localStorage.removeItem('utmParams'); // Limpa também os parâmetros salvos

      // Dispara evento de compra para Utmify e Meta Pixel
      if (window.utm_pixel && typeof window.utm_pixel.track === 'function') {
        window.utm_pixel.track('Purchase');
      }
      if (window.fbq && typeof window.fbq === 'function') {
        window.fbq('track', 'Purchase');
      }

      // Exibe um toast de sucesso
      toast({
        title: "Sucesso!",
        description: "Seu pagamento foi aprovado e seus itens serão creditados em breve.",
        variant: "default",
      });

    } catch (e) {
      console.error("Could not access localStorage or track events", e);
    }
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header avatarIcon={avatarIcon} />
      <main className="flex-1 flex items-center justify-center bg-cover bg-center p-4" style={{ backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-06d91604.png')" }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center max-w-md w-full">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Pagamento Aprovado!</h1>
          <p className="text-gray-600 mb-8">
            Seus itens serão creditados na sua conta de jogo em instantes.
            Agradecemos a sua compra!
          </p>
          <Link href="/">
            <Button variant="destructive" className="w-full text-lg py-3">
              Voltar para o Início
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
