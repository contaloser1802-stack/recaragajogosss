
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { specialOfferItems } from '@/lib/data';
import { PaymentPayload, ProductData } from '@/interfaces/types';
import { formatPhoneNumber } from '@/lib/utils';

declare global {
  interface Window {
    utm_pixel?: {
      (action: string, eventName: string): void;
      queue?: any[];
    };
    fbq?: (
      type: 'track',
      eventName: string,
      params?: { [key: string]: any }
    ) => void;
  }
}

const formSchema = z.object({
  name: z.string()
    .min(1, { message: "Nome é obrigatório." })
    .refine(value => value.trim().split(" ").length >= 2, {
      message: "Por favor, insira o nome e sobrenome.",
    }),
  email: z.string()
    .min(1, { message: "E-mail é obrigatório." })
    .email({ message: "Formato de e-mail inválido." }),
  phone: z.string()
    .min(1, { message: "Número de telefone é obrigatório." })
    .regex(/^\(\d{2}\) \d \d{4}-\d{4}$/, { message: "Formato de telefone inválido." }),
  promoCode: z.string().optional(),
});

function CheckoutComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [product, setProduct] = useState<ProductData | null>(null);
  const [playerName, setPlayerName] = useState("Carregando...");
  const [paymentMethodName] = useState("PIX");
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [utmParams, setUtmParams] = useState<{ [key: string]: string }>({});

  const selectedAppId = typeof window !== 'undefined' ? localStorage.getItem('selectedAppId') : '100067';
  const isDeltaForce = selectedAppId === '100151';

  const [gameInfo, setGameInfo] = useState({
    name: 'Free Fire',
    banner: 'https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-f997537d.jpg',
    icon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png',
    pointIcon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png'
  });

  const bgImage = isDeltaForce
    ? "https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/DF-1ac98424.png"
    : "https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-06d91604.png";

  const [avatarIcon, setAvatarIcon] = useState('https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png');

  useEffect(() => {
    const currentParams: { [key: string]: string } = {};
    let hasUtmParams = false;
    searchParams.forEach((value, key) => {
      if (key.startsWith('utm_')) {
          hasUtmParams = true;
      }
      currentParams[key] = value;
    });

    if (hasUtmParams) {
        localStorage.setItem('utmParams', JSON.stringify(currentParams));
        setUtmParams(currentParams);
    } else {
        const storedUtms = localStorage.getItem('utmParams');
        if (storedUtms) {
            setUtmParams(JSON.parse(storedUtms));
        }
    }
    
    try {
      const storedAppId = localStorage.getItem('selectedAppId');
      const storedProduct = localStorage.getItem('selectedProduct');
      const storedPlayerName = localStorage.getItem('playerName');

      if (storedAppId === '100151') {
        setGameInfo({
          name: 'Delta Force',
          banner: 'https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/DF-4dc01e48.jpg',
          icon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png',
          pointIcon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/151/point.png'
        });
        setAvatarIcon('https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png');
      } else {
        setAvatarIcon('https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png');
      }

      if (storedProduct) {
        setProduct(JSON.parse(storedProduct));
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Nenhum produto selecionado. Você será redirecionado.",
        });
        setTimeout(() => router.push('/'), 2000);
      }

      if (storedPlayerName) {
        setPlayerName(storedPlayerName);
      } else {
        setPlayerName("Não encontrado");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.",
      });
      router.push('/');
    }
  }, [router, toast, searchParams]);

  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout');
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      promoCode: '',
    },
  });

  const handleOfferChange = (offerId: string) => {
    setSelectedOffers(prev =>
      prev.includes(offerId) ? prev.filter(id => id !== offerId) : [...prev, offerId]
    );
  };

  const getNumericTotalAmount = useMemo(() => {
    if (!product) return 0;
    let mainProductPrice = product.price;
    let totalOffersPrice = selectedOffers.reduce((sum, offerId) => {
      const offer = specialOfferItems.find(o => o.id === offerId);
      return sum + (offer ? offer.price : 0);
    }, 0);
    return mainProductPrice + totalOffersPrice;
  }, [product, selectedOffers]);

  const calculateTotal = useMemo(() => {
    return getNumericTotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, [getNumericTotalAmount]);

  const promoCodeValue = form.watch("promoCode");

  const handleApplyPromoCode = () => {
    if (promoCodeValue === 'DIAMANTE100') {
      setIsPromoApplied(true);
      toast({
        title: "Sucesso!",
        description: "Código promocional aplicado.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Código promocional inválido.",
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: string) => void) => {
    const formatted = formatPhoneNumber(e.target.value);
    fieldChange(formatted);
  };

  const proceedToPayment = async () => {
    const isValid = await form.trigger(['name', 'email', 'phone']);
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios corretamente.",
      });
      return;
    }

    if (isDeltaForce) {
      handleFinalSubmit();
    } else {
      setIsModalOpen(true);
    }
  };

  const buildPayloadItems = () => {
    if (!product) return [];

    const payloadItems = [{
      unitPrice: product.price,
      title: product.name,
      quantity: 1,
      tangible: false,
      id: product.id,
    }];

    selectedOffers.forEach(offerId => {
      const offer = specialOfferItems.find(o => o.id === offerId);
      if (offer) {
        payloadItems.push({
          unitPrice: offer.price,
          title: offer.name,
          quantity: 1,
          tangible: false,
          id: offer.id,
        });
      }
    });

    return payloadItems;
  };

  const handleFinalSubmit = async () => {
    if (!product) {
      toast({ variant: "destructive", title: "Erro", description: "Produto não encontrado. Tente novamente." });
      return;
    }

    const values = form.getValues();
    const isValid = await form.trigger(['name', 'email', 'phone']);
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios corretamente.",
      });
      return;
    }

    setIsSubmitting(true);
    setIsModalOpen(false);

    const customerData = {
      name: values.name,
      email: values.email,
      phone: values.phone.replace(/\D/g, ''),
    };

    try {
      localStorage.setItem('customerData', JSON.stringify(customerData));
    } catch (e) {
      console.warn("Não foi possível salvar os dados do cliente no localStorage.");
    }

    const items = buildPayloadItems();
    const totalAmount = getNumericTotalAmount;
    const finalUtmParams = utmParams;


    const payload: PaymentPayload = {
      name: values.name,
      email: values.email,
      phone: values.phone.replace(/\D/g, ''),
      amount: totalAmount,
      externalId: `ff-${Date.now()}`,
      items: items,
      utmQuery: finalUtmParams,
    };

    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error || "Erro ao processar o pagamento";
        toast({ variant: "destructive", title: "Erro no pagamento", description: errorMessage });
        setIsSubmitting(false);
        return;
      }

      const paymentDataFromApi = responseData.data || responseData;

      localStorage.setItem('paymentData', JSON.stringify({
        ...paymentDataFromApi,
        external_id: payload.externalId,
        playerName: playerName,
        amount: calculateTotal,
        numericAmount: totalAmount,
        diamonds: product.totalAmount,
        originalAmount: product.originalAmount,
        bonusAmount: product.bonusAmount,
        totalAmount: product.totalAmount,
        productId: product.id,
        items: items,
        utmQuery: finalUtmParams,
      }));

      router.push('/buy');

    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no pagamento", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 relative">
          <Image
            src={bgImage}
            alt="background"
            fill
            className="-z-10 object-cover"
            priority
          />
          <div className="flex items-center justify-center h-screen bg-gray-100">
            <p>Carregando...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header avatarIcon={avatarIcon} />
      <main className="flex-1 relative">
        <Image
          src={bgImage}
          alt="background"
          fill
          className="-z-10 object-cover"
          priority
        />
        <div className="flex flex-col md:mx-auto md:my-6 md:max-w-[600px] md:rounded-2xl md:bg-white overflow-hidden">
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
                aria-label="Voltar para a pagina inicial"
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
              <Image className="h-3.5 w-3.5" src={gameInfo.pointIcon} width={14} height={14} alt="Moeda do jogo" data-ai-hint="diamond gem" />
              {product?.totalAmount}
            </dd>

            <div className="col-span-2 my-1 w-full">
              <ul className="flex flex-col gap-3 rounded-md border border-gray-200/50 bg-white p-3 text-xs/none md:text-sm/none">
                <li className="flex items-center justify-between gap-12">
                  <div className="text-gray-600">Preço Original</div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Image className="h-3 w-3 object-contain" src={gameInfo.pointIcon} width={12} height={12} alt="Moeda do jogo" data-ai-hint="diamond gem" />
                    <div className="font-medium text-gray-800">{product?.originalAmount}</div>
                  </div>
                </li>
                <li className="flex items-center justify-between gap-12">
                  <div className="text-gray-600">+ Bônus Geral</div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Image className="h-3 w-3 object-contain" src={gameInfo.pointIcon} width={12} height={12} alt="Moeda do jogo" data-ai-hint="diamond gem" />
                    <div className="font-medium text-gray-800">{product?.bonusAmount}</div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="col-span-2 mb-1 text-xs/normal text-gray-500 md:text-sm/normal">
              Os diamantes, são válidos apenas para a região do Brasil e serão creditados diretamente na conta de jogo.
            </div>

            <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Preço</dt>
            <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">
              {product?.formattedPrice}
            </dd>

            <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Método de pagamento</dt>
            <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">{paymentMethodName}</dd>

            <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Nome do Jogador</dt>
            <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">{playerName}</dd>
          </dl>

          <div className="h-2 bg-gray-200"></div>

          <Form {...form}>
            <form onSubmit={(e) => { e.preventDefault(); proceedToPayment(); }} className="flex flex-col gap-6 px-4 pb-8 pt-5 md:p-10 md:pt-6">
              <FormField
                control={form.control}
                name="promoCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[15px]/4 font-medium text-gray-800">Código promocional</FormLabel>
                    <div className="flex items-end">
                      <FormControl>
                        <Input {...field} placeholder="Código Promocional" className="flex-1 rounded-r-none border-r-0" disabled={isPromoApplied} />
                      </FormControl>
                      <Button type="button" className="rounded-l-none h-11 px-5 text-base" variant="destructive" disabled={promoCodeValue !== 'DIAMANTE100' || isPromoApplied} onClick={handleApplyPromoCode}>
                        {isPromoApplied ? "Aplicado" : "Aplicar"}
                      </Button>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[15px]/4 font-medium text-gray-800">Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome Completo" maxLength={50} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[15px]/4 font-medium text-gray-800">E-mail</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="E-mail" maxLength={60} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[15px]/4 font-medium text-gray-800">Número de telefone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        placeholder="(00) 0 0000-0000"
                        onChange={(e) => handlePhoneChange(e, field.onChange)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-gray-500 text-xs/normal">
                Ao clicar em “Prosseguir para Pagamento”, atesto que li e concordo com os termos de uso e com a política de privacidade.
              </div>

              <div className="mt-2">
                <Button type="submit" className="w-full h-11 text-base" variant="destructive" disabled={isSubmitting}>
                  {isSubmitting ? "Processando..." : "Prosseguir para pagamento"}
                </Button>
              </div>
            </form>
          </Form>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[425px] p-0">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-center text-xl">Promoção Especial</DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground pt-2">Aproveite estas ofertas exclusivas para turbinar ainda mais sua conta!</DialogDescription>
              </DialogHeader>
              <div className="p-6 py-0 space-y-2 max-h-[60vh] overflow-y-auto">
                {specialOfferItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg border cursor-pointer"
                    onClick={() => handleOfferChange(item.id)}
                  >
                    <div className="flex items-center gap-3 pointer-events-none">
                      <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                        <Image src={item.image} alt={item.name} width={64} height={64} className="w-full h-full object-cover" data-ai-hint="game item icon" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          <span className="line-through">R$ {item.originalPrice.toFixed(2).replace('.', ',')}</span>
                          <span className="text-destructive font-bold ml-1.5">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedOffers.includes(item.id)}
                      onCheckedChange={() => handleOfferChange(item.id)}
                    />
                  </div>
                ))}
              </div>
              <div className="p-6 pt-4 flex flex-col gap-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span>{calculateTotal}</span>
                </div>
                <Button onClick={handleFinalSubmit} disabled={isSubmitting} variant="destructive" className="w-full h-12 text-lg">
                  {isSubmitting ? "Finalizando..." : (selectedOffers.length > 0 ? `Adicionar e Pagar ${calculateTotal}` : "Finalizar Pedido")}
                </Button>
                {selectedOffers.length === 0 && (
                  <Button onClick={handleFinalSubmit} disabled={isSubmitting} variant="ghost" className="w-full">
                    Não, obrigado
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
}


export default function CheckoutPage() {
    return (
      <Suspense fallback={
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-06d91604.png')" }}>
            <div className="flex items-center justify-center h-screen bg-gray-900 bg-opacity-50">
              <p className="text-white text-xl">Carregando checkout...</p>
            </div>
          </main>
        </div>
      }>
        <CheckoutComponent />
      </Suspense>
    )
}
