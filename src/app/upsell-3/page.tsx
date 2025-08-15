
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { cn } from '@/lib/utils';
import { premiumStatusOffer } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { PaymentPayload } from '@/interfaces/types';
import BackRedirect from '@/components/freefire/BackRedirect';
import Image from 'next/image';

interface CustomerData {
    name: string;
    email: string;
    phone: string;
    cpf?: string;
}

const Upsell3Page = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const handleDecline = () => {
        router.push('/upsell-4');
    };

    const handlePurchase = async () => {
        setIsSubmitting(true);
        const selectedProduct = premiumStatusOffer[0];

        const customerDataString = localStorage.getItem('customerData');
        const playerName = localStorage.getItem('playerName') || 'Desconhecido';
        const utmParamsString = localStorage.getItem('utmParams');
        
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
        const utmQuery = utmParamsString ? JSON.parse(utmParamsString) : {};

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
            externalId: `ff-upsell3-premium-${Date.now()}`,
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
                throw new Error(data.error?.message || "Erro ao criar o pagamento para o status premium.");
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
            <BackRedirect redirectTo="/upsell-4" />
            <Header avatarIcon={avatarIcon} />
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 max-w-2xl w-full border">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase tracking-wider">
                        OFERTA EXCLUSIVA <span className="text-destructive">SE TORNE UM INFLUENCIADOR</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-600">
                        Eleve sua conta para o próximo nível virando o mais novo influencer e receba benefícios exclusivos.
                    </p>
                    
                    <div className="my-8">
                       <div className="p-4 rounded-lg border-2 border-amber-400 bg-amber-50 flex flex-col items-center gap-4">
                            <Image 
                                src={premiumStatusOffer[0].image}
                                alt={premiumStatusOffer[0].name}
                                width={600}
                                height={150}
                                className="rounded-md"
                                data-ai-hint="premium status banner"
                            />
                           <h2 className="text-xl font-bold text-gray-800">{premiumStatusOffer[0].name}</h2>
                           <p className="text-3xl font-extrabold text-gray-900">{premiumStatusOffer[0].formattedPrice}</p>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3 max-w-md mx-auto">
                        <Button
                            onClick={handlePurchase}
                            disabled={isSubmitting}
                            className="w-full text-lg py-6 font-bold"
                            variant="destructive"
                        >
                            {isSubmitting ? 'Processando...' : 'SIM, EU QUERO!'}
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

export default Upsell3Page;
