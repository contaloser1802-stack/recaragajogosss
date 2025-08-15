'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';

function SuccessContent() {
    const router = useRouter();
    const [customerName, setCustomerName] = useState('Cliente');
    const [avatarIcon, setAvatarIcon] = useState('https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png');


    useEffect(() => {
        try {
            const customerData = localStorage.getItem('customerData');
            if (customerData) {
                const parsedData = JSON.parse(customerData);
                setCustomerName(parsedData.name.split(' ')[0] || 'Cliente');
            }

            const storedAppId = localStorage.getItem('selectedAppId');
            if (storedAppId === '100151') {
                setAvatarIcon('https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png');
            }
        } catch (error) {
            console.error("Erro ao ler dados do localStorage:", error);
        }
    }, []);

    const handleContinue = () => {
        router.push('/');
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header avatarIcon={avatarIcon} />
            <main className="flex-1 flex items-center justify-center bg-gray-100 p-4" 
                style={{ 
                    backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-06d91604.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border-t-4 border-destructive">
                    <div className="flex justify-center mb-6">
                        <Image src="https://i.ibb.co/L5gP3k0/118151-trofeu-recompensa-brilho-gratis-vetor.png" alt="Troféu" width={100} height={100} data-ai-hint="trophy reward"/>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Parabéns, {customerName}!
                    </h1>
                    <p className="mt-4 text-gray-600">
                        Sua compra foi concluída com sucesso! Seus itens serão creditados em sua conta em breve.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                        Obrigado por comprar conosco. Agradecemos a sua preferência!
                    </p>
                    <Button 
                        onClick={handleContinue} 
                        className="mt-8 w-full text-lg py-6 font-bold"
                        variant="destructive"
                    >
                        Voltar para a Loja
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
}


export default function SuccessPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <SuccessContent />
        </Suspense>
    )
}
