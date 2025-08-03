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
import { PaymentPayload } from '@/interfaces/types';
import BackRedirect from '@/components/freefire/BackRedirect';

// Tipos para os dados do cliente
interface CustomerData {
    name: string;
    email: string;
    phone: string;
    cpf?: string;
}

const Upsell2Page = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(upsellOffers[0]?.id || null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutos em segundos
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUrgencyMessage, setShowUrgencyMessage] = useState(false);
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

        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    setShowUrgencyMessage(true); // Mostra a mensagem quando o tempo acabar
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleDecline = () => {
        router.push('/upsell-3');
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
            toast({ variant: 'destructive', title: 'Erro', description: 'Produto selecionado não encontrado.' });
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

        const customerData: CustomerData = JSON.parse(customerDataString);
        const utmQuery = new URLSearchParams(window.location.search).toString();

        const payloadItems = [{
            id: selectedProduct.id,
            title: selectedProduct.name,
            unitPrice: selectedProduct.price,
            quantity: 1,
            tangible: false
        }];

        const payload: PaymentPayload = {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone.replace(/\D/g, ''),
            cpf: customerData.cpf?.replace(/\D/g, ''),
            amount: selectedProduct.price,
            externalId: `ff-upsell2-${Date.now()}`,
            items: payloadItems,
            utmQuery,
        };
        
        try {
            const response = await fetch("/api/create-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || "Erro ao criar o pagamento para o upsell.");
            }
            
            localStorage.setItem('paymentData', JSON.stringify({
                ...data.data,
                external_id: payload.externalId,
                playerName: playerName,
                amount: selectedProduct.formattedPrice,
                numericAmount: selectedProduct.price,
                diamonds: selectedProduct.totalAmount,
                originalAmount: selectedProduct.originalAmount,
                bonusAmount: selectedProduct.bonusAmount,
                totalAmount: selectedProduct.totalAmount,
                productId: selectedProduct.id,
                items: payloadItems,
                utmQuery: utmQuery,
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
        <div className="flex flex-col min-h-screen bg-gray-50">
            <BackRedirect redirectTo="/upsell-3" />
            <Header avatarIcon={avatarIcon} />
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 max-w-lg w-full border relative overflow-hidden">

                    {showUrgencyMessage && (
                         <div className="absolute top-0 left-0 right-0 z-10 flex justify-center items-center p-4">
                            <p className="text-3xl font-extrabold text-destructive animate-pulse-intense tracking-wider uppercase">
                                ÚLTIMOS MINUTOS!!
                            </p>
                        </div>
                    )}
                    
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase tracking-wider mt-12">
                        Espere! Mais uma Oferta!
                    </h1>

                    <p className="mt-3 text-base text-gray-600">
                        Aproveite esta última chance para turbinar sua conta com diamantes extras por um preço imperdível.
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
