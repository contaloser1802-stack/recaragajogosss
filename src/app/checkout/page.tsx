
'use client';

import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const ShieldCheckIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]">
    <path d="M54.125 34.1211C55.2966 32.9495 55.2966 31.05 54.125 29.8784C52.9534 28.7069 51.0539 28.7069 49.8823 29.8784L38.0037 41.7571L32.125 35.8784C30.9534 34.7069 29.0539 34.7069 27.8823 35.8784C26.7108 37.05 26.7108 38.9495 27.8823 40.1211L35.8823 48.1211C37.0539 49.2926 38.9534 49.2926 40.125 48.1211L54.125 34.1211Z" fill="currentColor"></path>
    <path fillRule="evenodd" clipRule="evenodd" d="M43.4187 3.4715C41.2965 2.28554 38.711 2.28554 36.5889 3.4715L8.07673 19.4055C6.19794 20.4555 4.97252 22.4636 5.02506 24.7075C5.36979 39.43 10.1986 63.724 37.0183 76.9041C38.8951 77.8264 41.1125 77.8264 42.9893 76.9041C69.809 63.724 74.6377 39.43 74.9825 24.7075C75.035 22.4636 73.8096 20.4555 71.9308 19.4055L43.4187 3.4715ZM39.5159 8.7091C39.8191 8.53968 40.1885 8.53968 40.4916 8.7091L68.9826 24.6313C68.6493 38.3453 64.2154 59.7875 40.343 71.5192C40.135 71.6214 39.8725 71.6214 39.6646 71.5192C15.7921 59.7875 11.3583 38.3453 11.025 24.6313L39.5159 8.7091Z" fill="currentColor"></path>
  </svg>
);

const StepMarker = ({ number }: { number: string }) => (
  <div className="grid items-center">
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="col-start-1 row-start-1 text-2xl text-destructive">
      <path d="M0 3C0 1.34315 1.34315 0 3 0H21C22.6569 0 24 1.34315 24 3V15.7574C24 16.553 23.6839 17.3161 23.1213 17.8787L17.8787 23.1213C17.3161 23.6839 16.553 24 15.7574 24H3C1.34315 24 0 22.6569 0 21V3Z" fill="currentColor"></path>
    </svg>
    <div className="col-start-1 row-start-1 text-center text-base/none font-bold text-white">{number}</div>
  </div>
);

const diamondPacks = [
  { id: 'pack-1060', amount: "1.060", bonus: '1.060', price: '19.99', priceFormatted: 'R$ 19,99', productDescription: '2.120 Diamantes' },
  { id: 'pack-2180', amount: "2.180", bonus: '2.180', price: '27.99', priceFormatted: 'R$ 27,99', productDescription: '4.360 Diamantes' },
  { id: 'pack-5600', amount: "5.600", bonus: '5.600', price: '62.99', priceFormatted: 'R$ 62,99', productDescription: '11.200 Diamantes' },
  { id: 'pack-12800', amount: "12.800", bonus: '12.800', price: '109.99', priceFormatted: 'R$ 109,99', productDescription: '25.600 Diamantes' },
  { id: 'pack-25600', amount: "25.600", bonus: '25.600', price: '174.99', priceFormatted: 'R$ 174,99', productDescription: '51.200 Diamantes' },
  { id: 'pack-29900', amount: "29.900", bonus: '29.900', price: '209.99', priceFormatted: 'R$ 209,99', productDescription: '59.800 Diamantes' },
  { id: 'pack-44900', amount: "44.900", bonus: '44.900', price: '329.99', priceFormatted: 'R$ 329,99', productDescription: '89.800 Diamantes' },
];

const specialOffers = [
    { id: 'offer-weekly-sub', name: 'Assinatura Semanal', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/rebate/0000/000/002/logo.png', price: '19.99', priceFormatted: 'R$ 19,99', amount: '1.000', bonus: '300', productDescription: 'Assinatura Semanal' },
    { id: 'offer-monthly-sub', name: 'Assinatura Mensal', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/rebate/0000/081/041/logo.png', price: '32.90', priceFormatted: 'R$ 32,90', amount: '2.000', bonus: '600', productDescription: 'Assinatura Mensal' },
    { id: 'offer-booyah-pass', name: 'Passe Booyah', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/item/0803/000/000/logo.png', price: '19.99', priceFormatted: 'R$ 19,99', amount: '1.000', bonus: 'Passe Booyah', productDescription: 'Passe Booyah' },
    { id: 'offer-level-pack', name: 'Passe de Nível', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/rebate/0000/004/790/logo.png', price: '74.80', priceFormatted: 'R$ 74,80', amount: '7.800', bonus: '5.600', productDescription: 'Passe de Nível' }
];

const paymentMethods = [
  { id: 'payment-pix', name: 'PIX', displayName: 'Pix via PagSeguro', image: 'https://cdn-gop.garenanow.com/webmain/static/payment_center/br/menu/pix_boa_mb.png', type: 'pix' },
  { id: 'payment-cc-visa', name: 'Visa', displayName: 'Cartão de Crédito via PagSeguro (Aprovação, em média, imediata)', image: 'https://payment.boacompra.com/images-novo/layout/cartoes/visa-2021.png', type: 'cc' },
  { id: 'payment-cc-master', name: 'Mastercard', displayName: 'Cartão de Crédito via PagSeguro (Aprovação, em média, imediata)', image: 'https://payment.boacompra.com/images-novo/layout/cartoes/mastercard-2019.png', type: 'cc' },
  { id: 'payment-cc-elo', name: 'Elo', displayName: 'Cartão de Crédito via PagSeguro (Aprovação, em média, imediata)', image: 'https://payment.boacompra.com/images-novo/layout/cartoes/elo-2019.png', type: 'cc' },
  { id: 'payment-cc-amex', name: 'American Express', displayName: 'Cartão de Crédito via PagSeguro (Aprovação, em média, imediata)', image: 'https://payment.boacompra.com/images-novo/layout/cartoes/amex-2019.png', type: 'cc' },
  { id: 'payment-cc-hipercard', name: 'Hipercard', displayName: 'Cartão de Crédito via PagSeguro (Aprovação, em média, imediata)', image: 'https://payment.boacompra.com/images-novo/layout/cartoes/hipercard-2019.png', type: 'cc' },
];

function CheckoutPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [playerId, setPlayerId] = useState('');
    const [selectedRechargeId, setSelectedRechargeId] = useState<string | null>(null);
    const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
    
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [sheetView, setSheetView] = useState<'form' | 'pix'>('form');
    const [pixData, setPixData] = useState<{ pixCode: string, pixQrCode: string } | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        setIsMounted(true);
        const storedPlayerName = localStorage.getItem('playerName');
        const storedPlayerId = localStorage.getItem('playerId');
        if (storedPlayerName && storedPlayerId) {
            setPlayerName(storedPlayerName);
            setPlayerId(storedPlayerId);
        }
    }, []);

    const handleRechargeSelection = (itemId: string) => {
        setSelectedRechargeId(prev => (prev === itemId ? null : itemId));
    };

    const handlePaymentSelection = (itemId: string) => {
        setSelectedPaymentId(prev => (prev === itemId ? null : itemId));
    };

    const handleSelectionKeyDown = (e: KeyboardEvent<HTMLDivElement>, callback: () => void) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            callback();
        }
    };

    const allRechargeOptions = [...diamondPacks, ...specialOffers];
    const selectedItem = allRechargeOptions.find(item => item.id === selectedRechargeId);

    const handlePurchase = () => {
        if (!selectedRechargeId || !selectedItem) {
            toast({ variant: "destructive", title: "Erro", description: "Por favor, selecione um valor de recarga." });
            return;
        }

        if (!selectedPaymentId) {
            toast({ variant: "destructive", title: "Erro", description: "Por favor, selecione um método de pagamento." });
            return;
        }
        setSheetView('form');
        setIsSheetOpen(true);
    };

    if (!isMounted) {
        return (
            <div className="flex flex-col min-h-screen bg-white">
                <Header />
                <main className="flex-1 bg-white flex items-center justify-center">
                    <p>Carregando...</p>
                </main>
                <Footer />
            </div>
        );
    }
    

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="mb-5 flex h-full flex-col md:mb-12">
          <div className="bg-white">
            <div className="rounded-t-[14px] bg-white lg:rounded-none">
              <div className="mx-auto max-w-5xl p-2 pb-4 lg:px-10 lg:pt-9">
                <div className="mb-5 lg:mb-[28px]">
                  <div className="relative flex items-center overflow-hidden transition-all">
                    <div className="absolute h-full w-full rounded-t-lg bg-cover bg-center lg:rounded-lg" style={{ backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-f997537d.jpg')" }}></div>
                    <div className="relative flex items-center p-4 lg:p-6">
                      <Image className="h-11 w-11 lg:h-[72px] lg:w-[72px]" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png" width={72} height={72} alt="Free Fire Icon" data-ai-hint="game icon" />
                      <div className="ms-3 flex flex-col items-start lg:ms-5">
                        <div className="mb-1 text-base/none font-bold text-white lg:text-2xl/none">Free Fire</div>
                        <div className="flex items-center rounded border border-white/50 bg-black/[0.65] px-1.5 py-[5px] text-xs/none font-medium text-white lg:text-sm/none">
                          <ShieldCheckIcon /> Pagamento 100% Seguro
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-9 px-2 lg:px-0">
                  <div>
                    <div id="denom-section" className="mb-3 flex scroll-mt-16 items-center gap-2 text-lg/none font-bold text-gray-800 md:text-xl/none">
                      <StepMarker number="2" />
                      Valor de Recarga
                    </div>
                    <Tabs defaultValue="buy" className="w-full">
                      <TabsContent value="buy">
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 md:gap-4">
                          {diamondPacks.map((pack) => {
                            const itemId = pack.id;
                            const isSelected = selectedRechargeId === itemId;
                            return (
                              <div
                                key={itemId}
                                role="radio"
                                aria-checked={isSelected}
                                tabIndex={0}
                                onKeyDown={(e) => handleSelectionKeyDown(e, () => handleRechargeSelection(itemId))}
                                onClick={() => handleRechargeSelection(itemId)}
                                className={cn(
                                  "group relative flex min-h-[50px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md bg-white p-1 sm:min-h-[64px] md:min-h-[72px] border border-gray-200 outline-none transition-all",
                                  "focus-visible:ring-2 focus-visible:ring-ring",
                                  "aria-checked:ring-2 aria-checked:ring-destructive"
                                )}
                              >
                                <div className="flex flex-1 items-center">
                                  <Image className="me-1 h-3 w-3 object-contain md:h-4 md:w-4" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={16} height={16} alt="Diamante" data-ai-hint="diamond gem" />
                                  <span className="text-sm/none font-medium md:text-lg/none max-[350px]:text-xs/none">{pack.amount}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="my-4 flex items-center" role="none">
                          <div className="text-base/none font-bold text-gray-500" role="none">Ofertas especiais</div>
                          <hr className="ms-2 grow border-gray-300" role="none" />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
                          {specialOffers.map((offer) => {
                            const itemId = offer.id;
                            const isSelected = selectedRechargeId === itemId;
                            return (
                              <div
                                key={itemId}
                                role="radio"
                                aria-checked={isSelected}
                                tabIndex={0}
                                onKeyDown={(e) => handleSelectionKeyDown(e, () => handleRechargeSelection(itemId))}
                                onClick={() => handleRechargeSelection(itemId)}
                                className={cn("group peer relative flex h-full cursor-pointer flex-col items-center rounded-md bg-white p-1.5 pb-2 border border-gray-200",
                                  "focus-visible:ring-2 focus-visible:ring-ring",
                                  "aria-checked:ring-2 aria-checked:ring-destructive"
                                )}
                              >
                                <div className="relative mb-2 w-full overflow-hidden rounded-sm pt-[56.25%]">
                                  <Image className="pointer-events-none absolute inset-0 h-full w-full object-cover" src={offer.image} fill alt={offer.name} data-ai-hint="game offer" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="line-clamp-2 text-center text-sm/[18px] font-medium">{offer.name}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div>
                    <div id="channel-section" className="mb-3 flex scroll-mt-36 items-center gap-2 text-lg/none font-bold text-gray-800 md:text-xl/none">
                      <StepMarker number="3" />
                      <div>Método de pagamento</div>
                    </div>
                    <div role="radiogroup" className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4">
                      {paymentMethods.map((method) => {
                        const itemId = method.id;
                        const isSelected = selectedPaymentId === itemId;
                        const showPriceAndBonus = !!selectedRechargeId;

                        return (
                          <div
                            key={itemId}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => handleSelectionKeyDown(e, () => handlePaymentSelection(itemId))}
                            onClick={() => handlePaymentSelection(itemId)}
                            className={cn(
                              "group relative flex h-full min-h-[80px] cursor-pointer items-start gap-2 rounded-md border border-gray-200 bg-white p-2.5 transition-all focus-visible:ring-2 focus-visible:ring-ring max-md:flex-col max-md:justify-between md:items-center md:gap-3 md:p-3",
                              "aria-checked:border-destructive aria-checked:bg-destructive/5"
                            )}
                          >
                            <div className="shrink-0">
                              <Image className="pointer-events-none h-[60px] w-[60px] object-contain object-left md:h-14 md:w-14" src={method.image} width={75} height={75} alt={method.name} data-ai-hint="payment logo" />
                            </div>
                            {showPriceAndBonus && selectedItem && (
                              <div className="flex w-full flex-col flex-wrap gap-y-1 font-medium md:gap-y-2 text-sm/none md:text-base/none">
                                <div className="flex flex-wrap gap-x-0.5 gap-y-1 whitespace-nowrap md:flex-col">
                                  <span className="items-center inline-flex font-bold text-gray-800">{selectedItem.priceFormatted}</span>
                                </div>
                                <div className="flex flex-wrap gap-y-1 empty:hidden md:gap-y-2">
                                  <span className="inline-flex items-center text-xs/none text-primary md:text-sm/none">
                                    + Bônus <Image className="mx-1 h-3 w-3 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={12} height={12} alt="Diamante" data-ai-hint="diamond gem" />
                                    {selectedItem.bonus}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="absolute end-[3px] top-[3px] overflow-hidden rounded-[3px]">
                              <div className="flex text-[10px] font-bold uppercase leading-none">
                                <div className="flex items-center gap-1 bg-destructive p-0.5 pr-1 text-white">
                                  <Image
                                    className="h-3 w-3 rounded-sm bg-white object-contain p-0.5"
                                    src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png"
                                    width={12}
                                    height={12}
                                    alt="Diamante"
                                    data-ai-hint="diamond gem"
                                  />
                                  <span>Promo</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="z-[9] pointer-events-none sticky bottom-0"></div>
      </main>

      {selectedRechargeId && (
        <PurchaseFooter
          selectedRechargeId={selectedRechargeId}
          selectedPaymentId={selectedPaymentId}
          onPurchase={handlePurchase}
          product={selectedItem}
        />
      )}

      <CheckoutSheet 
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        view={view}
        setView={setView}
        selectedItem={selectedItem}
        playerName={playerName}
        onPixGenerated={setPixData}
        pixData={pixData}
      />
      <Footer />
    </div>
  );
}

const PurchaseFooter = ({ product, selectedPaymentId, onPurchase }: any) => {
  if (!product) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
      <div className="pointer-events-auto relative mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4 md:justify-end md:gap-10 lg:px-10">
        <div className="flex flex-col md:items-end">
          <div className="flex items-center gap-1 text-sm/none font-bold md:text-end md:text-base/none">
            <Image className="h-4 w-4 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={16} height={16} alt="Diamante" data-ai-hint="diamond gem" />
            <span dir="ltr">{product.amount} + {product.bonus}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm/none md:text-end md:text-base/none">
            <span className="font-medium text-gray-600">Total:</span>
            <span className="font-bold text-destructive">{product.priceFormatted}</span>
          </div>
        </div>
        <Button className="px-5 text-base font-bold h-11" variant="destructive" disabled={!selectedPaymentId} onClick={onPurchase}>
          <ShieldCheckIcon />
          Compre agora
        </Button>
      </div>
    </div>
  );
};


const checkoutFormSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório." }).refine(value => value.trim().split(" ").length >= 2, { message: "Por favor, insira o nome e sobrenome." }),
  email: z.string().min(1, { message: "E-mail é obrigatório." }).email({ message: "Formato de e-mail inválido." }),
  phone: z.string().min(1, { message: "Número de telefone é obrigatório." }).regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, { message: "Formato de telefone inválido." }),
  cpf: z.string().min(14, { message: "CPF inválido." }),
});


const CheckoutSheet = ({ isOpen, onOpenChange, view, setView, selectedItem, playerName, onPixGenerated, pixData }: any) => {
    const handleBackToForm = () => setView('form');

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="p-0 w-full max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                {view === 'form' && selectedItem && (
                    <CheckoutForm 
                        selectedItem={selectedItem} 
                        playerName={playerName}
                        onSuccess={(data: any) => {
                            onPixGenerated(data);
                            setView('pix');
                        }} 
                    />
                )}
                {view === 'pix' && pixData && selectedItem && (
                    <PixDisplay 
                        pixData={pixData} 
                        selectedItem={selectedItem} 
                        playerName={playerName}
                        onBack={handleBackToForm}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
};

const CheckoutForm = ({ selectedItem, playerName, onSuccess }: any) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof checkoutFormSchema>>({
        resolver: zodResolver(checkoutFormSchema),
        mode: 'onChange',
        defaultValues: { name: '', email: '', phone: '', cpf: '' },
    });

    const handleMaskedChange = (e: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: string) => void, mask: (value: string) => string) => {
        fieldChange(mask(e.target.value));
    };
    
    const phoneMask = (value: string) => value.replace(/\D/g, '').slice(0, 11).replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4,5})(\d{4})/, '$1-$2');
    const cpfMask = (value: string) => value.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    const onSubmit = async (values: z.infer<typeof checkoutFormSchema>) => {
        setIsSubmitting(true);
        try {
            const payload = {
                name: values.name,
                email: values.email,
                phone: values.phone.replace(/\D/g, ''),
                cpf: values.cpf.replace(/\D/g, ''),
                amount: parseFloat(selectedItem.price.replace(',', '.')),
                externalId: `ff-${Date.now()}`,
                items: [{
                    unitPrice: parseFloat(selectedItem.price.replace(',', '.')),
                    title: selectedItem.productDescription,
                    quantity: 1,
                    tangible: false,
                }],
            };

            const response = await fetch("/api/create-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Erro ao processar o pagamento");
            
            if (data.pixQrCode || data.pixCode) {
                 onSuccess(data);
            } else {
                 throw new Error("Resposta de pagamento inválida");
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro no pagamento", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b">
                 <h2 className="text-lg font-semibold">Finalizar Compra</h2>
            </div>
             <div className="flex-1 overflow-y-auto">
                <div className="bg-gray-50 p-6 border-b">
                    <div className="flex items-center gap-4">
                        <Image className="block h-16 w-16 overflow-hidden rounded-lg bg-white object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png" alt="Free Fire" width={64} height={64}/>
                        <div>
                            <div className="text-lg font-bold text-gray-800">Free Fire</div>
                            <div className="text-sm text-gray-600">Recarga de Diamantes</div>
                        </div>
                    </div>
                </div>
                <dl className="p-6 space-y-4 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-gray-600">Jogador</dt>
                        <dd className="font-medium text-gray-800">{playerName}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-gray-600">Produto</dt>
                        <dd className="font-medium text-gray-800">{selectedItem.productDescription}</dd>
                    </div>
                    <div className="flex justify-between items-baseline pt-4 border-t">
                        <dt className="text-base font-semibold text-gray-800">Total</dt>
                        <dd className="text-base font-bold text-destructive">{selectedItem.priceFormatted}</dd>
                    </div>
                </dl>
                <div className="p-6 pt-0">
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                           <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} placeholder="Seu nome completo" /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>E-mail</FormLabel><FormControl><Input {...field} type="email" placeholder="seu@email.com" /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={form.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} placeholder="000.000.000-00" onChange={(e) => handleMaskedChange(e, field.onChange, cpfMask)}/></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} placeholder="(00) 00000-0000" onChange={(e) => handleMaskedChange(e, field.onChange, phoneMask)}/></FormControl><FormMessage /></FormItem>)} />
                           <Button type="submit" className="w-full h-11 text-base mt-6" variant="destructive" disabled={isSubmitting}>
                            {isSubmitting ? "Processando..." : "Prosseguir para pagamento"}
                           </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};

const PixDisplay = ({ pixData, selectedItem, playerName, onBack }: any) => {
    const { toast } = useToast();
    const handleCopyCode = () => {
        if (navigator.clipboard && pixData.pixCode) {
            navigator.clipboard.writeText(pixData.pixCode);
            toast({
                title: "Copiado!",
                description: "O código Pix foi copiado para a área de transferência.",
            });
        }
    };
    return (
      <div className="flex flex-col h-full bg-gray-50">
          <div className="p-4 border-b bg-white flex items-center">
              <Button variant="ghost" size="icon" className="mr-2" onClick={onBack}>
                  <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-center flex-1">Pagar com PIX</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center">
                  <p className="text-gray-600">Recarga para:</p>
                  <p className="font-bold text-lg text-gray-800">{playerName}</p>
                  <p className="font-bold text-2xl text-destructive mt-1">{selectedItem.priceFormatted}</p>
              </div>

              <div className="my-6 flex items-center justify-center">
                  {pixData.pixQrCode ? (
                      <Image
                          src={pixData.pixQrCode}
                          alt="QR Code Pix"
                          width={200}
                          height={200}
                          data-ai-hint="qr code"
                      />
                  ) : (
                      <Skeleton className="h-[200px] w-[200px]" />
                  )}
              </div>
              
              <div className="text-center text-gray-500 text-sm mb-4">
                  Pague com o QR Code ou use o código abaixo.
              </div>

              <div className="mb-4 mt-3 select-all break-words rounded-md bg-white p-4 text-sm/[22px] text-gray-800 border">
                  {pixData.pixCode || <Skeleton className="h-5 w-full" />}
              </div>

              <Button className="w-full h-11 text-base font-bold" variant="destructive" onClick={handleCopyCode} disabled={!pixData.pixCode}>
                  Copiar Código
              </Button>

              <div className="text-gray-500 text-xs space-y-3 mt-6">
                  <p className="font-semibold">Para realizar o pagamento siga os passos abaixo:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-2">
                      <li>Abra o app do seu banco e selecione a opção Pix.</li>
                      <li>Escolha "Pagar com QR Code" ou "Pix Copia e Cola".</li>
                      <li>Confirme as informações e finalize o pagamento.</li>
                  </ol>
                  <p>Você receberá seus diamantes em poucos minutos após a confirmação do pagamento.</p>
              </div>
          </div>
      </div>
    );
};
