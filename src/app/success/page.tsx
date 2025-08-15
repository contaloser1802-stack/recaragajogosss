'use client';

<<<<<<< HEAD
import { useEffect, Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';

function SuccessContent() {
    const router = useRouter();
    const [customerName, setCustomerName] = useState('Cliente');
    const [avatarIcon, setAvatarIcon] = useState('https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png');


    useEffect(() => {
        try {
            const customerData = localStorage.getItem('customerData');
            if (customerData) {
                const parsedData = JSON.parse(customerData);
                setCustomerName(parsedData.name.split(' ')[0] || 'Cliente');
            }

            const storedAppId = localStorage.getItem('selectedAppId');
            if (storedAppId === '100151') {
                setAvatarIcon('https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png');
            }
        } catch (error) {
            console.error("Erro ao ler dados do localStorage:", error);
        }
    }, []);

    const handleContinue = () => {
        router.push('/');
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header avatarIcon={avatarIcon} />
            <main className="flex-1 flex items-center justify-center bg-gray-100 p-4" 
                style={{ 
                    backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-06d91604.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border-t-4 border-destructive">
                    <div className="flex justify-center mb-6">
                        <Image src="https://i.ibb.co/L5gP3k0/118151-trofeu-recompensa-brilho-gratis-vetor.png" alt="Troféu" width={100} height={100} data-ai-hint="trophy reward"/>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Parabéns, {customerName}!
                    </h1>
                    <p className="mt-4 text-gray-600">
                        Sua compra foi concluída com sucesso! Seus itens serão creditados em sua conta em breve.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                        Obrigado por comprar conosco. Agradecemos a sua preferência!
                    </p>
                    <Button 
                        onClick={handleContinue} 
                        className="mt-8 w-full text-lg py-6 font-bold"
                        variant="destructive"
                    >
                        Voltar para a Loja
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
}


export default function SuccessPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <SuccessContent />
        </Suspense>
    )
=======
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
      track: (eventName: string, params?: { [key: string]: any }) => void;
    };
    fbq?: (
      type: 'track',
      eventName: string,
      params?: { [key: string]: any }
    ) => void;
    gtag?: (
      ...args: any[]
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
      
      const paymentDataString = localStorage.getItem('paymentData');
      if (paymentDataString) {
          const paymentData = JSON.parse(paymentDataString);
          const purchaseParams = {
              value: paymentData.numericAmount || 0,
              currency: 'BRL',
          };

          if (window.utm_pixel && typeof window.utm_pixel.track === 'function') {
            window.utm_pixel.track('Purchase', purchaseParams);
          }
          if (window.fbq && typeof window.fbq === 'function') {
            window.fbq('track', 'Purchase', purchaseParams);
          }
          
          // --- SNIPPET DO GOOGLE ADS ADICIONADO AQUI ---
          if (window.gtag && typeof window.gtag === 'function') {
            window.gtag('event', 'conversion', {
              'send_to': 'AW-17448187029/b-gvCKmw5YEbEJXp-P9A',
              'value': paymentData.numericAmount,
              'currency': 'BRL',
              'transaction_id': paymentData.external_id,
            });
          }
          // --- FIM DO SNIPPET DO GOOGLE ADS ---
      }

      // Limpa dados de transação e cliente
      localStorage.removeItem('paymentData');
      localStorage.removeItem('customerData');
      localStorage.removeItem('utmParams');

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
>>>>>>> 1b9e35dbce48b3fe1b2f106a7bef016942c9168b
}
