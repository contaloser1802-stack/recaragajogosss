'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { CheckCircle, Hourglass, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PaymentData {
  qr_code_url?: string;
  qr_code_text?: string;
  playerName?: string;
  productDescription?: string;
  amount?: string;
  diamonds?: string;
}

function BuyContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const data = localStorage.getItem('paymentData');
      if (data) {
        const parsedData = JSON.parse(data);
        setPaymentData(parsedData);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Dados do pagamento não encontrados. Você será redirecionado.",
        });
        setTimeout(() => router.push('/'), 2000);
      }
    } catch (error) {
      console.error("Failed to parse payment data from localStorage", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao carregar os dados do pagamento.",
      });
      router.push('/');
    }
  }, [router, toast]);

  const handleCopy = () => {
    if (paymentData?.qr_code_text) {
      navigator.clipboard.writeText(paymentData.qr_code_text);
      setCopied(true);
      toast({
        title: "Sucesso!",
        description: "Código PIX copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando dados do pagamento...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:mx-auto md:my-6 md:max-w-[600px] md:rounded-2xl md:bg-white overflow-hidden p-6 md:p-10 text-center">
      <div className="flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Quase lá!</h1>
        <p className="text-gray-600 mb-6">Pague com o PIX para concluir a compra.</p>

        {paymentData.qr_code_url && (
          <div className="mb-6 p-4 border rounded-lg">
            <Image
              src={paymentData.qr_code_url}
              alt="QR Code PIX"
              width={250}
              height={250}
              data-ai-hint="qr code"
            />
          </div>
        )}

        <div className="w-full max-w-md mb-6">
          <p className="text-sm text-gray-500 mb-2">Se preferir, copie o código e pague no app do seu banco:</p>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={paymentData.qr_code_text || ''}
              className="w-full p-3 pr-24 border rounded-lg bg-gray-50 text-sm truncate"
            />
            <Button
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4"
              variant="destructive"
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        </div>

        <Alert className="text-left mb-6 w-full max-w-md">
          <Hourglass className="h-4 w-4" />
          <AlertTitle>Aguardando pagamento</AlertTitle>
          <AlertDescription>
            Você tem 10 minutos para pagar. Após o pagamento, os diamantes podem levar alguns minutos para serem creditados.
          </AlertDescription>
        </Alert>

        <div className="border-t border-b w-full max-w-md py-4 mb-6">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-600">Jogador:</span>
            <span className="font-medium text-gray-800">{paymentData.playerName}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Produto:</span>
            <span className="font-medium text-gray-800">{paymentData.productDescription} ({paymentData.diamonds} Diamantes)</span>
          </div>
        </div>

        <div className="w-full max-w-md text-center">
            <p className="text-lg font-bold">Total: <span className="text-destructive">{paymentData.amount}</span></p>
        </div>

        <Alert variant="destructive" className="mt-6 text-left w-full max-w-md">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-bold">Atenção!</AlertTitle>
            <AlertDescription>
                Não feche esta página até confirmar o pagamento. Os diamantes são creditados apenas para a conta e ID do jogador exibidos aqui.
            </AlertDescription>
        </Alert>

        <Link href="/" className="mt-8">
          <Button variant="outline">Voltar para o início</Button>
        </Link>
      </div>
    </div>
  );
}


export default function BuyPage() {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-06d91604.png')" }}>
          <Suspense fallback={<div className="flex items-center justify-center h-full">Carregando...</div>}>
            <BuyContent />
          </Suspense>
        </main>
        <Footer />
      </div>
    );
  }
