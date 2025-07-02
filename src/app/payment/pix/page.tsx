'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

const PixPaymentPage = () => {
    const { toast } = useToast();
    const [pixCode, setPixCode] = useState("");
    const [pixImage, setPixImage] = useState("");
    const [playerName, setPlayerName] = useState("Carregando...");
    const [paymentData, setPaymentData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedPixCode = localStorage.getItem("pixCode");
            const storedPixImage = localStorage.getItem("pixImage");
            const storedPlayerName = localStorage.getItem('playerName');
            const storedCheckoutData = localStorage.getItem('checkoutData');

            if (storedPixCode && storedPixImage && storedPlayerName && storedCheckoutData) {
                setPixCode(storedPixCode);
                setPixImage(storedPixImage);
                setPlayerName(storedPlayerName);
                setPaymentData(JSON.parse(storedCheckoutData));
            } else {
                throw new Error("Dados incompletos no localStorage.");
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: error.message || 'Erro ao carregar os dados do pagamento.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleCopyCode = () => {
        if (navigator.clipboard && pixCode) {
            navigator.clipboard.writeText(pixCode);
            toast({
                title: "Copiado!",
                description: "O código Pix foi copiado para a área de transferência.",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-white">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <p>Carregando dados do pagamento...</p>
                </main>
                <Footer />
            </div>
        );
    }

    if (!paymentData) {
        return (
            <div className="flex flex-col min-h-screen bg-white">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-xl font-bold mb-4">Erro ao carregar os dados do pagamento.</p>
                        <Button asChild><Link href="/">Voltar para o início</Link></Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Header />
            <main className="flex-1">
                <div className="flex flex-col md:mx-auto md:my-6 md:max-w-[600px] md:rounded-2xl md:bg-gray-50 overflow-hidden">
                    {/* Cabeçalho com banner e botão de voltar */}
                    <div className="mb-3 bg-gray-50 md:mb-4 md:rounded-t-2xl md:p-2 md:pb-0">
                        <div className="relative h-20 md:h-[120px] md:rounded-t-lg overflow-hidden">
                            <Image 
                                src="https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-f997537d.jpg"
                                alt="Banner"
                                fill
                                className="object-cover"
                            />
                            <Link 
                                href="/" 
                                className="absolute start-4 top-4 md:start-6 md:top-6 flex items-center gap-1.5 rounded-full bg-black/40 p-1.5 pr-3 text-sm font-medium text-white hover:bg-black/60 ring-1 ring-white/70"
                            >
                                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                                Voltar
                            </Link>
                        </div>
                        <div className="relative mx-5 -mt-9 md:-mt-10 flex flex-col items-center gap-4">
                            <Image 
                                src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png"
                                alt="Free Fire"
                                width={80}
                                height={80}
                                className="rounded-lg ring-4 ring-gray-50 bg-white"
                            />
                            <div className="text-center text-xl font-bold text-gray-800">Free Fire</div>
                        </div>
                    </div>

                    {/* Informações do pagamento */}
                    <dl className="grid grid-cols-2 gap-x-3.5 px-4 md:px-10 mb-4">
                        <dt className="text-sm text-gray-600">Total</dt>
                        <dd className="text-sm font-medium text-right text-gray-800 flex items-center justify-end gap-1">
                            <Image src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={14} height={14} alt="Diamante" />
                            {paymentData.totalAmount}
                        </dd>

                        <dt className="text-sm text-gray-600 col-span-2">Detalhes</dt>
                        <dd className="col-span-2">
                            <ul className="bg-white border rounded-md p-3 text-xs md:text-sm">
                                <li className="flex justify-between">
                                    <span className="text-gray-600">Preço Original</span>
                                    <span>{paymentData.originalAmount}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-600">Bônus</span>
                                    <span>{paymentData.bonusAmount}</span>
                                </li>
                            </ul>
                        </dd>

                        <dt className="text-sm text-gray-600">Método</dt>
                        <dd className="text-sm text-right font-medium text-gray-800">{paymentData.paymentMethodName}</dd>

                        <dt className="text-sm text-gray-600">Jogador</dt>
                        <dd className="text-sm text-right font-medium text-gray-800">{playerName}</dd>
                    </dl>

                    <div className="h-2 bg-gray-200" />

                    {/* Área Pix */}
                    <div className="flex flex-col gap-6 px-4 pb-8 pt-5 md:p-10 md:pt-6">
                        <div className="text-center text-lg font-medium text-gray-800">Pague com Pix</div>
                        
                        <div className="my-3 flex justify-center">
                            {pixImage ? (
                                <Image src={pixImage} alt="QR Code Pix" width={150} height={150} />
                            ) : (
                                <Skeleton className="h-[150px] w-[150px]" />
                            )}
                        </div>

                        <div className="text-center text-gray-500 text-sm">
                            PAGSEGURO TECNOLOGIA LTDA <br />
                            CNPJ: 06.375.668/0003-61
                        </div>

                        <div className="bg-gray-100 p-4 text-sm rounded-md select-all break-words">
                            {pixCode || <Skeleton className="h-5 w-full" />}
                        </div>

                        <Button 
                            className="h-11 text-base font-bold" 
                            variant="destructive" 
                            onClick={handleCopyCode}
                            disabled={!pixCode}
                        >
                            Copiar Código
                        </Button>

                        {/* Instruções */}
                        <div className="text-sm text-gray-500 space-y-4">
                            <p className="font-semibold">Para realizar o pagamento:</p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Abra seu app ou site do banco e selecione Pix.</li>
                                <li>Cole o código Pix ou escaneie o QR Code.</li>
                                <li>Confirme o valor e finalize o pagamento.</li>
                            </ol>
                            <p>O pagamento é processado pelo nosso parceiro PagSeguro.</p>
                            <p>Os diamantes serão entregues após a confirmação do pagamento (geralmente em minutos).</p>
                            <p>Se tiver dúvidas, acesse o suporte do PagSeguro: <a href="https://customer.international.pagseguro.com/pt-br" className="underline" target="_blank" rel="noopener noreferrer">https://customer.international.pagseguro.com/pt-br</a></p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}