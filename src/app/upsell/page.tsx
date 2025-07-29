'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { cn } from '@/lib/utils';
import { upsellOffers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const UpsellPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(upsellOffers[0]?.id || null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutos em segundos

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    router.push('/success'); // Se o tempo acabar, vai para a página de sucesso
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handlePurchase = () => {
        if (!selectedOfferId) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Por favor, selecione uma oferta para continuar.',
            });
            return;
        }

        const selectedProduct = upsellOffers.find(p => p.id === selectedOfferId);
        if (!selectedProduct) return;

        try {
            // Salva o produto do upsell para a página de checkout
            localStorage.setItem('selectedProduct', JSON.stringify(selectedProduct));
            localStorage.setItem('paymentMethodName', 'PIX'); // Assume PIX para o upsell
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
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase tracking-wider">
                        Espere! Oferta Especial!
                    </h1>
                    <p className="mt-3 text-base text-gray-600">
                        Sua compra foi aprovada! Antes de prosseguir, aproveite esta oferta exclusiva por tempo limitado.
                    </p>
                    
                    <div className="my-6">
                        <p className="text-sm uppercase font-semibold text-gray-500">A oferta termina em:</p>
                        <div className="text-5xl font-bold text-destructive animate-pulse mt-1">{formatTime(timeLeft)}</div>
                    </div>

                    <div className="flex flex-col gap-4 my-8">
                        {upsellOffers.map(offer => (
                            <div
                                key={offer.id}
                                onClick={() => setSelectedOfferId(offer.id)}
                                className={cn(
                                    "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 text-left flex items-center gap-4",
                                    selectedOfferId === offer.id ? 'border-destructive bg-destructive/5' : 'border-gray-200 bg-white hover:border-gray-300'
                                )}
                            >
                                <div className="flex-shrink-0">
                                    <Image src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" alt="Diamante" width={40} height={40} data-ai-hint="diamond gem" />
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
                            Sim, Eu Quero Esta Oferta!
                        </Button>
                        <Button
                            onClick={() => router.push('/success')}
                            variant="link"
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Não, obrigado. Leve-me para a confirmação.
                        </Button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default UpsellPage;
