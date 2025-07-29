'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { cn } from '@/lib/utils';
import { taxOffer } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

const Upsell2Page = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(taxOffer[0]?.id || null);

    const handlePurchase = () => {
        if (!selectedOfferId) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Nenhuma taxa selecionada.',
            });
            return;
        }

        const selectedProduct = taxOffer.find(p => p.id === selectedOfferId);
        if (!selectedProduct) return;

        try {
            // Adiciona a taxa ao que já foi selecionado
            localStorage.setItem('selectedProduct', JSON.stringify(selectedProduct));
            localStorage.setItem('paymentMethodName', 'PIX');
            router.push('/checkout');
        } catch (e) {
            console.error("Failed to access localStorage", e);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível iniciar o checkout. Verifique as permissões do seu navegador.",
            });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 max-w-lg w-full">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase tracking-wider">
                        Liberação Imediata
                    </h1>
                    <p className="mt-3 text-base text-gray-600">
                        Para garantir a entrega imediata e segura dos seus diamantes, é necessário o pagamento de uma pequena taxa de transação prioritária.
                    </p>
                    
                    <div className="flex flex-col gap-4 my-8">
                        {taxOffer.map(offer => (
                            <div
                                key={offer.id}
                                className={cn(
                                    "p-4 rounded-lg border-2 cursor-default transition-all duration-200 text-left flex items-center gap-4",
                                    selectedOfferId === offer.id ? 'border-destructive bg-destructive/5' : 'border-gray-200 bg-white'
                                )}
                            >
                                <div className="flex-shrink-0">
                                    <Image src="https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/ic-safety-919638c4.png" alt="Taxa" width={40} height={40} data-ai-hint="shield" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">{offer.name}</h2>
                                    <p className="text-2xl font-extrabold text-gray-900">{offer.formattedPrice}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handlePurchase}
                            disabled={!selectedOfferId}
                            className="w-full text-lg py-6 font-bold"
                            variant="destructive"
                        >
                            Pagar Taxa e Liberar Diamantes
                        </Button>
                        <Button
                            onClick={() => router.push('/success')}
                            variant="link"
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Não, obrigado.
                        </Button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Upsell2Page;
