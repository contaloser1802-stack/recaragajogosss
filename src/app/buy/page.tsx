'use client';

import { useState, useEffect, useRef } from 'react';
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
import { upsellOffers, taxOffer, downsellOffers, skinOffers } from '@/lib/data';
import BackRedirect from '@/components/freefire/BackRedirect';

// Interface para os dados de pagamento recebidos do localStorage e da API
interface PaymentData {
  pix?: {
    code?: string;
    qrcode_base64?: string;
  };
  playerName?: string;
  productDescription?: string;
  amount?: string;
  numericAmount?: number;
  diamonds?: string;
  external_id?: string;
  created_at?: string; 
  status?: string;
  originalAmount?: string;
  bonusAmount?: string;
  totalAmount?: string;
  productId?: string;
  items?: any[];
  utmQuery?: string;
}


const BuyPage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [pixCode, setPixCode] = useState<string>("");
  const [pixImage, setPixImage] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("Carregando...");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'UNKNOWN'>('PENDING');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);


  const [gameInfo, setGameInfo] = useState({
      name: 'Free Fire',
      banner: 'https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-f997537d.jpg',
      icon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png',
      pointIcon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png',
      currencyName: 'diamantes'
  });


  const getSuccessRedirectPath = (productId?: string) => {
    const selectedAppId = typeof window !== 'undefined' ? localStorage.getItem('selectedAppId') : '100067';
    if (selectedAppId === '100151') {
      return '/success'; // Jogo Delta Force vai direto para o sucesso
    }
  
    // Lógica de upsell apenas para Free Fire
    if (!productId) return '/upsell'; // Default da compra principal
  
    const isUpsell1 = skinOffers.some(o => o.id === productId);
    const isUpsell2 = upsellOffers.some(o => o.id === productId);
    const isUpsell3 = taxOffer.some(o => o.id === productId);
    const isDownsell = downsellOffers.some(o => o.id === productId);
    
    if (isDownsell) return '/upsell'; // Pagou downsell, vai pro upsell 1
    if (isUpsell1) return '/upsell-2'; // Pagou upsell 1 (skins), vai pro 2
    if (isUpsell2) return '/upsell-3'; // Pagou upsell 2 (diamantes), vai pro 3
    if (isUpsell3) return '/success';  // Pagou upsell 3 (taxa), vai pro sucesso
  
    return '/upsell'; // Fallback para compra principal
  };

  useEffect(() => {
    isMounted.current = true;
    let timerId: NodeJS.Timeout | null = null;

    const loadAndMonitorPaymentData = () => {
      try {
        const storedAppId = localStorage.getItem('selectedAppId');
        if (storedAppId === '100151') {
          setGameInfo({
              name: 'Delta Force',
              banner: 'https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/DF-4dc01e48.jpg',
              icon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png',
              pointIcon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/151/point.png',
              currencyName: 'Delta Coins'
          });
        }

        const storedPaymentData = localStorage.getItem("paymentData");

        if (storedPaymentData) {
          const parsed: PaymentData = JSON.parse(storedPaymentData);
          console.log("Dados parseados do localStorage na BuyPage:", parsed);

          if (!parsed.pix?.qrcode_base64 || !parsed.pix?.code || !parsed.external_id) {
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

          setPixCode(parsed.pix.code);
          setPixImage(parsed.pix.qrcode_base64);
          setPlayerName(parsed.playerName || "Desconhecido");
          setPaymentData(parsed); 
          setIsLoading(false);
          const currentStatus = parsed.status ? parsed.status.toUpperCase() as any : 'PENDING';
          setPaymentStatus(currentStatus);

          const startPolling = (externalId: string) => {
            let attempt = 0;
            const maxAttempts = 30; 
            const initialDelay = 5000;
            const maxDelay = 20000; 
            
            const poll = async () => {
              if (!isMounted.current || paymentStatus === 'PAID' || attempt >= maxAttempts) {
                  if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
                  return;
              }
              try {
                const res = await fetch(`/api/create-payment?externalId=${externalId}`);
                if (!res.ok) {
                    if (res.status !== 404) {
                       console.error("Erro na API de status do pagamento:", res.status, await res.text());
                       setPaymentStatus('UNKNOWN');
                       return;
                    }
                }
                const statusData = await res.json();
                console.log("Resposta do status da API (backend):", statusData);
                const newStatus: typeof paymentStatus = statusData.status?.toUpperCase() || 'PENDING';
                
                if (isMounted.current) {
                  if (newStatus !== paymentStatus) {
                      setPaymentStatus(newStatus);
                  }
                  
                  if (newStatus === 'PAID' || newStatus === 'EXPIRED' || newStatus === 'CANCELLED') {
                    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
                    return; 
                  }
                }

              } catch (error) {
                console.error("Erro ao checar status do pagamento:", error);
                 if (isMounted.current) setPaymentStatus('UNKNOWN');
                return;
              }
              
              attempt++;
              const delay = Math.min(initialDelay * Math.pow(1.5, attempt), maxDelay);
              pollTimeoutRef.current = setTimeout(poll, delay);
            };
            poll();
          };

          const EXPIRATION_MINUTES = 15;
          if (parsed.created_at) {
            const createdAtTimestamp = new Date(parsed.created_at).getTime();
            const expiresAtTimestamp = createdAtTimestamp + EXPIRATION_MINUTES * 60 * 1000;
            
            timerId = setInterval(() => {
              if (!isMounted.current) {
                if (timerId) clearInterval(timerId);
                return;
              }

              const now = Date.now();
              const newTimeLeft = Math.max(0, Math.floor((expiresAtTimestamp - now) / 1000));
              setTimeLeft(newTimeLeft);

              if (newTimeLeft <= 0) {
                if (timerId) clearInterval(timerId);
                // Apenas atualiza se o status ainda for PENDING, para não sobrescrever um status 'PAID'
                setPaymentStatus(prevStatus => prevStatus === 'PENDING' ? 'EXPIRED' : prevStatus);
              }
            }, 1000);
          }

          if (parsed.external_id && currentStatus === 'PENDING') {
            startPolling(parsed.external_id);
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
      isMounted.current = false;
      if (timerId) clearInterval(timerId);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  useEffect(() => {
      if (!isMounted.current) return;

      if (paymentStatus === 'PAID') {
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
          const redirectPath = getSuccessRedirectPath(paymentData?.productId);
          router.push(redirectPath);
          localStorage.removeItem('paymentData');
      } else if (paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED') {
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
          toast({
              variant: "destructive",
              title: "Pagamento Expirado/Cancelado",
              description: "Por favor, inicie uma nova compra.",
          });
          localStorage.removeItem('paymentData');
          setTimeout(() => router.push('/'), 3000);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus, paymentData, router, toast]);

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
        <Header avatarIcon={gameInfo.icon} />
        <main className="flex-1 bg-white flex items-center justify-center">
          <p>Carregando dados do pagamento...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const showTimeLeft = timeLeft !== null && paymentStatus === 'PENDING' && timeLeft > 0;
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <BackRedirect redirectTo="/downsell" />
      <Header avatarIcon={gameInfo.icon} />
      <main className="flex-1 bg-white">
        <div className="flex flex-col md:mx-auto md:my-6 md:max-w-[600px] md:rounded-2xl md:bg-gray-50 overflow-hidden">
          <div className="mb-3 bg-gray-50 md:mb-4 md:rounded-t-2xl md:p-2 md:pb-0">
            <div className="relative h-20 overflow-hidden md:h-[120px] md:rounded-t-lg">
              <Image
                className="h-full w-full object-cover"
                src={gameInfo.banner}
                alt={`${gameInfo.name} Banner`}
                fill
                priority
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
                src={gameInfo.icon}
                alt={gameInfo.name}
                width={80}
                height={80}
                data-ai-hint="game icon"
              />
              <div className="text-center text-xl/none font-bold text-gray-800 md:text-2xl/none">{gameInfo.name}</div>
            </div>
          </div>

          <dl className="mb-3 grid grid-cols-2 justify-between gap-x-3.5 px-4 md:mb-4 md:px-10">
            <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Total</dt>
            <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">
              <Image className="h-3.5 w-3.5" src={gameInfo.pointIcon} width={14} height={14} alt="Moeda do Jogo" data-ai-hint="diamond gem" />
              {paymentData.totalAmount || 'N/A'}
            </dd>

            <div className="col-span-2 my-1 w-full">
              <ul className="flex flex-col gap-3 rounded-md border border-gray-200/50 bg-white p-3 text-xs/none md:text-sm/none">
                <li className="flex items-center justify-between gap-12">
                  <div className="text-gray-600">Preço Original</div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Image className="h-3 w-3 object-contain" src={gameInfo.pointIcon} width={12} height={12} alt="Moeda do Jogo" data-ai-hint="diamond gem" />
                    <div className="font-medium text-gray-800">{paymentData.originalAmount || 'N/A'}</div>
                  </div>
                </li>
                <li className="flex items-center justify-between gap-12">
                  <div className="text-gray-600">+ Bônus Geral</div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Image className="h-3 w-3 object-contain" src={gameInfo.pointIcon} width={12} height={12} alt="Moeda do Jogo" data-ai-hint="diamond gem" />
                    <div className="font-medium text-gray-800">{paymentData.bonusAmount || 'N/A'}</div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="col-span-2 mb-1 text-xs/normal text-gray-500 md:text-sm/normal">
              Os {gameInfo.currencyName}, são válidos apenas para a região do Brasil e serão creditados diretamente na conta de jogo.
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
              {paymentStatus === 'PAID' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {(paymentStatus === 'EXPIRED' || paymentStatus === 'UNKNOWN' || paymentStatus === 'CANCELLED') && <Info className="h-4 w-4 text-red-500" />}
              <AlertTitle>
                {paymentStatus === 'PENDING' && 'Aguardando pagamento'}
                {paymentStatus === 'PAID' && 'Pagamento Aprovado!'}
                {paymentStatus === 'EXPIRED' && 'Pagamento Expirado!'}
                {paymentStatus === 'CANCELLED' && 'Pagamento Cancelado!'}
                {paymentStatus === 'UNKNOWN' && 'Verificando status...'}
              </AlertTitle>
              <AlertDescription>
                {paymentStatus === 'PENDING' && (
                  <>
                    Você tem {showTimeLeft ? <span className="font-bold">{formatTime(timeLeft)}</span> : 'alguns minutos'} para pagar.
                    Após o pagamento, os {gameInfo.currencyName} podem levar alguns minutos para serem creditados.
                  </>
                )}
                {paymentStatus === 'PAID' && `Seus ${gameInfo.currencyName} serão creditados na conta do jogo em instantes. Estamos te redirecionando...`}
                {(paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED') && 'O tempo para pagamento se esgotou ou foi cancelado. Por favor, inicie uma nova compra.'}
                {paymentStatus === 'UNKNOWN' && 'Não foi possível verificar o status do pagamento. Por favor, aguarde ou recarregue a página.'}
              </AlertDescription>
            </Alert>

            <div className="flex w-full flex-col">
              <div className="text-center text-lg/none font-medium text-gray-800">Pague com Pix</div>
              <div className="my-3 flex h-[150px] w-full items-center justify-center">
                {pixImage ? (
                  <Image
                    src={`data:image/png;base64,${pixImage}`}
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
                REAL TECH DIGITAL LTDA <br />
                CNPJ:54.228.163/0001-53
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
                <p>Seu pedido está sendo processado pelo nosso parceiro BuckPay.</p>
                <p>Você receberá seus {gameInfo.currencyName} após recebermos a confirmação do pagamento. Isso ocorre geralmente em alguns minutos após a realização do pagamento na sua instituição financeira.</p>
                <p>
                  Em caso de dúvidas entre em contato com o suporte.
                </p>
              </div>
            </div>
            
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
