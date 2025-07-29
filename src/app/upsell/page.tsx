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
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutos em segundos

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    router.push('/success');
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

    const handleSelectOffer = (id: string) => {
        setSelectedOfferId(id);
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
            // Usa o mesmo localstorage que a página de checkout espera
            localStorage.setItem('selectedProduct', JSON.stringify(selectedProduct));
            localStorage.setItem('paymentMethodName', 'PIX'); // ou o método que desejar
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
        <div className="flex flex-col min-h-screen bg-gray-900 text-white">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-black/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 md:p-12 max-w-2xl w-full border border-yellow-400/50">
                    <h1 className="text-2xl md:text-4xl font-bold text-yellow-400 uppercase tracking-wider">Espere! Oferta Especial!</h1>
                    <p className="mt-4 text-lg text-gray-300">Sua compra foi aprovada! Antes de prosseguir, aproveite esta oferta exclusiva por tempo limitado.</p>
                    
                    <div className="my-6">
                        <p className="text-lg">A OFERTA TERMINA EM:</p>
                        <div className="text-5xl font-bold text-destructive animate-pulse">{formatTime(timeLeft)}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                        {upsellOffers.map(offer => (
                            <div
                                key={offer.id}
                                onClick={() => handleSelectOffer(offer.id)}
                                className={cn(
                                    "p-6 rounded-lg border-2 cursor-pointer transition-all duration-300",
                                    selectedOfferId === offer.id ? 'border-yellow-400 bg-yellow-400/10 scale-105' : 'border-gray-600 hover:border-yellow-400/50'
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Image src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" alt="Diamante" width={32} height={32} data-ai-hint="diamond gem" />
                                    <h2 className="text-2xl font-bold">{offer.originalAmount} Diamantes</h2>
                                </div>
                                <p className="mt-2 text-3xl font-extrabold text-yellow-400">{offer.formattedPrice}</p>
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={handlePurchase}
                        disabled={!selectedOfferId}
                        className="w-full text-lg py-7 bg-yellow-400 text-black font-bold hover:bg-yellow-500 disabled:bg-gray-500"
                    >
                        SIM, EU QUERO ESTA OFERTA!
                    </Button>
                    <Button
                        onClick={() => router.push('/success')}
                        variant="link"
                        className="mt-4 text-gray-400 hover:text-white"
                    >
                        Não, obrigado. Quero apenas finalizar minha compra original.
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default UpsellPage;
