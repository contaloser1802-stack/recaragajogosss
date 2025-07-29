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
import { useRouter } from 'next/navigation';
import { CheckCircle, Hourglass, Info, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { upsellOffers, taxOffer, downsellOffers } from '@/lib/data';
import BackRedirect from '@/components/freefire/BackRedirect';

// Interface para os dados de pagamento recebidos do localStorage (e da API)
interface PaymentData {
  pixQrCode?: string;
  pixCode?: string;
  playerName?: string;
  productDescription?: string;
  amount?: string; // Valor formatado para exibição (ex: "R$ 47,98")
  diamonds?: string; // Total de diamantes (ex: "4.360")
  externalId?: string;
  expiresAt?: string; // String ISO 8601 (ex: "2025-07-28T03:00:00.000Z")
  status?: string; // Status inicial da transação, se fornecido
  originalAmount?: string; // Preço original do produto (diamantes)
  bonusAmount?: string;    // Bônus de diamantes
  totalAmount?: string;    // Total de diamantes (original + bônus)
  productId?: string; // ID do produto para lógica de redirecionamento
}

const BuyPage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [pixCode, setPixCode] = useState<string>("");
  const [pixImage, setPixImage] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("Carregando...");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'APPROVED' | 'EXPIRED' | 'CANCELLED' | 'UNKNOWN'>('PENDING');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let timerId: NodeJS.Timeout | null = null;

    const loadAndMonitorPaymentData = () => {
      try {
        // CÓDIGO DO PIXEL (mantido)
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
        // FIM CÓDIGO DO PIXEL

        const storedPaymentData = localStorage.getItem("paymentData");

        if (storedPaymentData) {
          const parsed: PaymentData = JSON.parse(storedPaymentData);
          console.log("Dados parseados do localStorage na BuyPage:", parsed); // Log para depuração

          if (!parsed.pixQrCode || !parsed.pixCode || !parsed.externalId) {
            console.error("Dados de pagamento incompletos no localStorage:", parsed);
            toast({
              variant: 'destructive',
              title: 'Erro',
              description: 'Dados de pagamento incompletos. Redirecionando para o início.',
            });
            setIsLoading(false);
            setTimeout(() => router.push('/'), 2000);
            return;
          }

          setPixCode(parsed.pixCode);
          setPixImage(parsed.pixQrCode);
          setPlayerName(parsed.playerName || "Desconhecido");
          setPaymentData(parsed); 
          setIsLoading(false);

          setPaymentStatus(parsed.status ? parsed.status.toUpperCase() as any : 'PENDING');

          if (parsed.expiresAt) {
            const expiresAtTimestamp = new Date(parsed.expiresAt).getTime();
            const initialTimeLeft = Math.max(0, Math.floor((expiresAtTimestamp - Date.now()) / 1000));
            setTimeLeft(initialTimeLeft);

            if (initialTimeLeft <= 0) {
              setPaymentStatus('EXPIRED');
              toast({
                variant: "destructive",
                title: "Pagamento Expirado!",
                description: "O tempo para pagamento se esgotou. Inicie uma nova compra.",
              });
              localStorage.removeItem('paymentData');
            } else {
              timerId = setInterval(() => {
                setTimeLeft(prevTime => {
                  if (prevTime === null) return null;
                  if (prevTime <= 1) {
                    clearInterval(timerId as NodeJS.Timeout);
                    if (paymentStatus === 'PENDING') {
                      setPaymentStatus('EXPIRED');
                      toast({
                        variant: "destructive",
                        title: "Pagamento Expirado!",
                        description: "O tempo para pagamento se esgotou. Inicie uma nova compra.",
                      });
                      localStorage.removeItem('paymentData');
                    }
                    return 0;
                  }
                  return prevTime - 1;
                });
              }, 1000);
            }
          } else {
            console.warn("expiresAt não encontrado nos dados de pagamento. Usando tempo fixo de 10 minutos para o contador.");
            setTimeLeft(600); // Fallback para 10 minutos
            timerId = setInterval(() => {
                setTimeLeft(prevTime => {
                  if (prevTime === null) return null;
                  if (prevTime <= 1) {
                    clearInterval(timerId as NodeJS.Timeout);
                    if (paymentStatus === 'PENDING') {
                      setPaymentStatus('EXPIRED');
                      toast({
                        variant: "destructive",
                        title: "Pagamento Expirado!",
                        description: "O tempo para pagamento se esgotou. Inicie uma nova compra.",
                      });
                      localStorage.removeItem('paymentData');
                    }
                    return 0;
                  }
                  return prevTime - 1;
                });
              }, 1000);
          }

          if (parsed.externalId && paymentStatus !== 'EXPIRED' && paymentStatus !== 'APPROVED') {
            intervalId = setInterval(async () => {
              try {
                console.log("Consultando status para externalId:", parsed.externalId);
                const res = await fetch(`/api/create-payment?externalId=${parsed.externalId}`);
                if (!res.ok) {
                   console.error("Erro na API de status do pagamento:", res.status, await res.text());
                   setPaymentStatus('UNKNOWN'); 
                   if (intervalId) clearInterval(intervalId);
                   return;
                }
                const statusData = await res.json();
                console.log("Resposta do status da API (backend):", statusData);

                if (res.ok && statusData.status) {
                  let newStatus: typeof paymentStatus = statusData.status.toUpperCase();
                  if (newStatus === 'PAID') newStatus = 'APPROVED';
                  
                  setPaymentStatus(newStatus);

                  if (newStatus === 'APPROVED') {
                    if (intervalId) clearInterval(intervalId);
                    if (timerId) clearInterval(timerId);

                    // Lógica de redirecionamento pós-pagamento
                    const isUpsell1 = upsellOffers.some(o => o.id === parsed.productId);
                    const isDownsell = downsellOffers.some(o => o.id === parsed.productId);
                    const isUpsell2 = taxOffer.some(o => o.id === parsed.productId);
                    
                    localStorage.removeItem('paymentData'); // Limpa dados da transação atual

                    if (isUpsell1 || isDownsell) {
                        router.push('/upsell-2'); // Pagou upsell 1 OU downsell, vai para upsell 2 (taxa)
                    } else if (isUpsell2) {
                        router.push('/success'); // Pagou upsell 2 (taxa), vai para sucesso
                    } else {
                        router.push('/upsell'); // Pagou compra principal, vai para upsell 1
                    }

                  } else if (newStatus === 'EXPIRED' || newStatus === 'CANCELLED') {
                    if (intervalId) clearInterval(intervalId);
                    if (timerId) clearInterval(timerId);
                    toast({
                      variant: "destructive",
                      title: "Pagamento Expirado/Cancelado",
                      description: "Por favor, inicie uma nova compra.",
                    });
                    localStorage.removeItem('paymentData');
                    setTimeout(() => router.push('/'), 3000);
                  }
                } else {
                  console.warn("Resposta de status da API inválida ou sem status:", statusData);
                }
              } catch (error) {
                console.error("Erro ao checar status do pagamento:", error);
                setPaymentStatus('UNKNOWN');
                if (intervalId) clearInterval(intervalId);
              }
            }, 5000);
          }

        } else {
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível carregar os dados do pagamento. Por favor, tente novamente.',
          });
          setIsLoading(false);
          setTimeout(() => router.push('/'), 2000);
        }
      } catch (error) {
        console.error("Erro fatal ao carregar ou parsear dados do pagamento do localStorage:", error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Ocorreu um erro ao carregar os dados do pagamento. Redirecionando.',
        });
        setIsLoading(false);
        setTimeout(() => router.push('/'), 2000);
      }
    };

    loadAndMonitorPaymentData();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timerId) clearInterval(timerId);
    };
  }, [router, toast, paymentStatus]);

  const handleCopyCode = () => {
    if (navigator.clipboard && pixCode) {
      navigator.clipboard.writeText(pixCode);
      toast({
        title: "Copiado!",
        description: "O código Pix foi copiado para a área de transferência.",
      });
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading || !paymentData) {
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

  const showTimeLeft = timeLeft !== null && paymentStatus === 'PENDING' && timeLeft > 0;
  
  const getSuccessRedirectPath = () => {
    if (!paymentData?.productId) return '/upsell';
    const isUpsell1 = upsellOffers.some(o => o.id === paymentData.productId);
    const isDownsell = downsellOffers.some(o => o.id === paymentData.productId);
    const isUpsell2 = taxOffer.some(o => o.id === paymentData.productId);
    
    if (isUpsell1 || isDownsell) return '/upsell-2';
    if (isUpsell2) return '/success';
    return '/upsell'; // Default para compra principal
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <BackRedirect redirectTo="/downsell" />
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
                href="/"
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
              {paymentData.totalAmount || 'N/A'}
            </dd>

            <div className="col-span-2 my-1 w-full">
              <ul className="flex flex-col gap-3 rounded-md border border-gray-200/50 bg-white p-3 text-xs/none md:text-sm/none">
                <li className="flex items-center justify-between gap-12">
                  <div className="text-gray-600">Preço Original</div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Image className="h-3 w-3 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={12} height={12} alt="Diamante" data-ai-hint="diamond gem" />
                    <div className="font-medium text-gray-800">{paymentData.originalAmount || 'N/A'}</div>
                  </div>
                </li>
                <li className="flex items-center justify-between gap-12">
                  <div className="text-gray-600">+ Bônus Geral</div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Image className="h-3 w-3 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={12} height={12} alt="Diamante" data-ai-hint="diamond gem" />
                    <div className="font-medium text-gray-800">{paymentData.bonusAmount || 'N/A'}</div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="col-span-2 mb-1 text-xs/normal text-gray-500 md:text-sm/normal">
              Os diamantes, são válidos apenas para a região do Brasil e serão creditados diretamente na conta de jogo.
            </div>

            <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Preço</dt>
            <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">
              {paymentData.amount || 'R$ 0,00'}
            </dd>

            <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Método de pagamento</dt>
            <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">PIX</dd>

            <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Nome do Jogador</dt>
            <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">{playerName}</dd>
          </dl>

          <div className="h-2 bg-gray-200"></div>

          <div className="flex flex-col gap-6 px-4 pb-8 pt-5 md:p-10 md:pt-6">
            <Alert className="text-left w-full max-w-md mx-auto">
              {paymentStatus === 'PENDING' && <Hourglass className="h-4 w-4" />}
              {paymentStatus === 'APPROVED' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {(paymentStatus === 'EXPIRED' || paymentStatus === 'UNKNOWN' || paymentStatus === 'CANCELLED') && <Info className="h-4 w-4 text-red-500" />}
              <AlertTitle>
                {paymentStatus === 'PENDING' && 'Aguardando pagamento'}
                {paymentStatus === 'APPROVED' && 'Pagamento Aprovado!'}
                {paymentStatus === 'EXPIRED' && 'Pagamento Expirado!'}
                {paymentStatus === 'CANCELLED' && 'Pagamento Cancelado!'}
                {paymentStatus === 'UNKNOWN' && 'Verificando status...'}
              </AlertTitle>
              <AlertDescription>
                {paymentStatus === 'PENDING' && (
                  <>
                    Você tem {showTimeLeft ? <span className="font-bold">{formatTime(timeLeft)}</span> : 'alguns minutos'} para pagar.
                    Após o pagamento, os diamantes podem levar alguns minutos para serem creditados.
                  </>
                )}
                {paymentStatus === 'APPROVED' && 'Seus diamantes serão creditados na conta do jogo em instantes. Estamos te redirecionando...'}
                {(paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED') && 'O tempo para pagamento se esgotou ou foi cancelado. Por favor, inicie uma nova compra.'}
                {paymentStatus === 'UNKNOWN' && 'Não foi possível verificar o status do pagamento. Por favor, aguarde ou recarregue a página.'}
              </AlertDescription>
            </Alert>

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
            {paymentStatus === 'APPROVED' && (
                <Link href={getSuccessRedirectPath()} className="mt-8">
                  <Button variant="default">Ir para a próxima etapa</Button>
                </Link>
            )}
            {(paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED') && (
                <Link href="/" className="mt-8">
                  <Button variant="destructive">Iniciar Nova Compra</Button>
                </Link>
            )}
            {paymentStatus === 'UNKNOWN' && (
                <Button onClick={() => router.reload()} className="mt-8" variant="outline">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Recarregar Página
                </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BuyPage;
