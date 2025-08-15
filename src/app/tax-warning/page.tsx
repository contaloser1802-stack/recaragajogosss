
'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { useEffect, useState } from 'react';

export default function TaxWarningPage() {
  const [avatarIcon, setAvatarIcon] = useState('https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png');

  useEffect(() => {
    try {
      const storedAppId = localStorage.getItem('selectedAppId');
      if (storedAppId === '100151') {
          setAvatarIcon('https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png');
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header avatarIcon={avatarIcon} />
      <main className="flex-1 flex items-center justify-center bg-cover bg-center p-4" style={{ backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-06d91604.png')" }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center max-w-md w-full">
          <AlertTriangle className="h-20 w-20 text-destructive mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Pagamento da Taxa Pendente</h1>
          <p className="text-gray-600 mb-8">
            A taxa de liberação obrigatória não foi paga. Para receber os produtos que você adquiriu, é necessário concluir este pagamento.
          </p>
          <Link href="/upsell-4">
            <Button variant="destructive" className="w-full text-lg py-3">
              Pagar Taxa Agora
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
