'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { useToast } from "@/hooks/use-toast";

export default function SuccessPage() {
  const { toast } = useToast();

  useEffect(() => {
    // Limpa todos os dados de transação e cliente do localStorage
    localStorage.removeItem('paymentData');
    localStorage.removeItem('customerData');


    // Exibe um toast de sucesso ao carregar a página
    toast({
      title: "Sucesso!",
      description: "Seu pagamento foi aprovado e seus diamantes serão creditados em breve.",
      variant: "default",
    });
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-cover bg-center p-4" style={{ backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-06d91604.png')" }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center max-w-md w-full">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Pagamento Aprovado!</h1>
          <p className="text-gray-600 mb-8">
            Seus diamantes serão creditados na sua conta de jogo em instantes.
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
