'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { skinOffers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { PaymentPayload } from '@/interfaces/types';
import BackRedirect from '@/components/freefire/BackRedirect';

// Tipos para os dados do cliente
interface CustomerData {
    name: string;
    email: string;
    phone: string;
}

const UpsellPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedSkins, setSelectedSkins] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDecline = () => {
        router.push('/downsell');
    };
    
    const handleSkinSelection = (skinId: string) => {
        setSelectedSkins(prev => 
            prev.includes(skinId) 
                ? prev.filter(id => id !== skinId)
                : [...prev, skinId]
        );
    };

    const totalNumericAmount = useMemo(() => {
        return selectedSkins.reduce((sum, skinId) => {
            const offer = skinOffers.find(o => o.id === skinId);
            return sum + (offer ? offer.price : 0);
        }, 0);
    }, [selectedSkins]);

    const totalAmount = useMemo(() => {
        return totalNumericAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }, [totalNumericAmount]);


    const handlePurchase = async () => {
        if (selectedSkins.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Nenhuma skin selecionada',
                description: 'Por favor, selecione pelo menos uma skin para continuar.',
            });
            return;
        }

        setIsSubmitting(true);

        const selectedProducts = skinOffers.filter(p => selectedSkins.includes(p.id));
        if (selectedProducts.length === 0) {
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

            const payloadItems = selectedProducts.map(p => ({
                id: p.id,
                title: p.name,
                unitPrice: p.price,
                quantity: 1,
                tangible: false,
            }));


            const payload: Omit<PaymentPayload, 'cpf'> = {
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone.replace(/\D/g, ''),
                paymentMethod: "PIX",
                amount: totalNumericAmount,
                externalId: `ff-upsell1-skins-${Date.now()}`,
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
                throw new Error(data.message || "Erro ao criar o pagamento para as skins.");
            }

            localStorage.setItem('paymentData', JSON.stringify({
                ...data,
                playerName: playerName,
                amount: totalAmount,
                numericAmount: totalNumericAmount,
                diamonds: 'Skins Especiais', // Placeholder
                originalAmount: '',
                bonusAmount: '',
                totalAmount: 'Skins',
                productId: selectedProducts[0].id, // Usa o ID do primeiro item para a lógica de redirect
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
            <BackRedirect redirectTo="/downsell" />
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 max-w-lg w-full border">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase tracking-wider">
                        Oferta Exclusiva de Skins
                    </h1>
                    <p className="mt-3 text-base text-gray-600">
                        Sua compra foi um sucesso! Que tal adicionar estas skins raras à sua coleção por um preço especial?
                    </p>
                    
                    <div className="flex flex-col gap-3 my-8">
                        {skinOffers.map(offer => (
                             <div
                                key={offer.id}
                                onClick={() => handleSkinSelection(offer.id)}
                                className={cn(
                                    "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 text-left flex items-center gap-4",
                                    selectedSkins.includes(offer.id) ? 'border-destructive bg-destructive/5' : 'border-gray-200 bg-white hover:border-gray-300'
                                )}
                            >
                                <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                                    <Image 
                                        src={offer.image} 
                                        alt={offer.name} 
                                        width={64} 
                                        height={64} 
                                        className="object-cover w-full h-full"
                                        data-ai-hint="character skin" 
                                    />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-base font-bold text-gray-800">{offer.name}</h2>
                                    <p className="text-lg font-extrabold text-gray-900">{offer.formattedPrice}</p>
                                </div>
                                <Checkbox
                                    checked={selectedSkins.includes(offer.id)}
                                    onCheckedChange={() => handleSkinSelection(offer.id)}
                                    className="h-6 w-6"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center font-bold text-xl my-6">
                        <span>Total:</span>
                        <span>{totalAmount}</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handlePurchase}
                            disabled={isSubmitting || selectedSkins.length === 0}
                            className="w-full text-lg py-6 font-bold"
                            variant="destructive"
                        >
                            {isSubmitting ? 'Processando...' : `Adicionar e Pagar ${totalAmount}`}
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

export default UpsellPage;
