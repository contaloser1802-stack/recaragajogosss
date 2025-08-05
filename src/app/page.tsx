'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, Gift, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { GameSelection } from '@/components/freefire/GameSelection';
import { diamondPacks, specialOffers, paymentMethods, deltaForcePacks, deltaForceSpecialOffers } from '@/lib/data';
import { ImageCarousel } from '@/components/freefire/ImageCarousel';
import { PurchaseFooter } from '@/components/freefire/PurchaseFooter';
import { ShieldCheckIcon, StepMarker, InfoIcon, SwitchAccountIcon } from '@/components/freefire/Icons';
import { HistoryPopover } from '@/components/freefire/HistoryPopover';
import { DeltaForceContent } from '@/components/deltaforce/DeltaForceContent';


function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRechargeId, setSelectedRechargeId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  type LoginHistoryItem = { id: string; name: string };
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [isHistoryPopoverOpen, setIsHistoryPopoverOpen] = useState(false);

  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isSocialLoginAlertOpen, setIsSocialLoginAlertOpen] = useState(false);
  const [isFreeItemModalOpen, setIsFreeItemModalOpen] = useState(false);

  const selectedApp = searchParams.get('app') || '100067';
  const showFreeFireContent = selectedApp === '100067';
  const showDeltaForceContent = selectedApp === '100151';

  const historyKey = `playerHistory_${selectedApp}`;

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(historyKey);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      } else {
        setHistory([]);
      }
      const storedPlayerName = localStorage.getItem('playerName');
      const storedPlayerId = localStorage.getItem('playerId');
      const storedAppId = localStorage.getItem('selectedAppId');
      
      if (storedPlayerId && storedAppId === selectedApp) {
        setPlayerName(storedPlayerName || '');
        setPlayerId(storedPlayerId);
        setIsLoggedIn(true);
      } else {
        // Clear old login data if the app has changed
        handleLogout(false);
      }
    } catch (e) {
        console.error("Failed to access localStorage", e);
        handleLogout(false);
    }
  }, [selectedApp, historyKey]);

  const updateHistory = useCallback((newItem: LoginHistoryItem) => {
    setHistory(prevHistory => {
      const otherAccounts = prevHistory.filter(item => item.id !== newItem.id);
      const newHistory = [newItem, ...otherAccounts].slice(0, 5);
      try {
        localStorage.setItem(historyKey, JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to access localStorage", e);
      }
      return newHistory;
    });
  }, [historyKey]);

  const removeFromHistory = (idToRemove: string) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item.id !== idToRemove);
      try {
        localStorage.setItem(historyKey, JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to access localStorage", e);
      }
      return newHistory;
    });
  };

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

  const performLogin = useCallback(async (id: string) => {
    if (!id) {
      setError('Por favor, insira um ID válido.');
      return;
    }
    setIsLoading(true);
    setError('');
    setPlayerId(id);

    if (showDeltaForceContent) {
        const fakeNickname = '';
        setPlayerName(fakeNickname);
        setIsLoggedIn(true);
        localStorage.setItem('playerName', fakeNickname);
        localStorage.setItem('playerId', id);
        localStorage.setItem('selectedAppId', selectedApp);
        updateHistory({ id: id, name: fakeNickname });
        setIsHistoryPopoverOpen(false);
        setIsLoading(false);
        return;
    }

    // Free Fire login logic
    try {
      const response = await fetch(`/api/player-lookup?uid=${id}`);
      const data = await response.json();

      if (response.ok && data.nickname) {
        const nickname = data.nickname;
        setPlayerName(nickname);
        setIsLoggedIn(true);
        localStorage.setItem('playerName', nickname);
        localStorage.setItem('playerId', id);
        localStorage.setItem('selectedAppId', selectedApp);
        updateHistory({ id: id, name: nickname });
        setIsHistoryPopoverOpen(false);
      } else {
        setError(data.error || 'ID de jogador não encontrado.');
        localStorage.removeItem('playerName');
        localStorage.removeItem('playerId');
        localStorage.removeItem('selectedAppId');
        setIsLoggedIn(false);
        setPlayerName('');
      }
    } catch (err) {
      setError('Erro ao buscar jogador. Tente novamente.');
      localStorage.removeItem('playerName');
      localStorage.removeItem('playerId');
      localStorage.removeItem('selectedAppId');
      setIsLoggedIn(false);
      setPlayerName('');
    } finally {
      setIsLoading(false);
    }
  }, [updateHistory, selectedApp, showDeltaForceContent]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    await performLogin(playerId);
  };

  const handleLogout = (showAlert = true) => {
    setIsLoggedIn(false);
    setPlayerName('');
    setPlayerId('');
    setError('');
    setSelectedRechargeId(null);
    setSelectedPaymentId(null);
    localStorage.removeItem('playerName');
    localStorage.removeItem('playerId');
    localStorage.removeItem('selectedAppId');
    if (showAlert) {
      setIsLogoutAlertOpen(false);
    }
  };

  const getAllRechargeOptions = () => {
    if (showDeltaForceContent) {
      return [...deltaForcePacks, ...deltaForceSpecialOffers];
    }
    return [...diamondPacks, ...specialOffers];
  };

  const handlePurchase = () => {
    if (!isLoggedIn) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Você deve fazer login para continuar.",
        });
        const loginSection = document.getElementById('login-section');
        if (loginSection) {
            loginSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }

    if (!selectedRechargeId) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Por favor, selecione um valor de recarga.",
        });
        return;
    }

    if (!selectedPaymentId) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Por favor, selecione um método de pagamento.",
        });
        return;
    }

    const allRechargeOptions = getAllRechargeOptions();
    const selectedProduct = allRechargeOptions.find(p => p.id === selectedRechargeId);
    if (!selectedProduct) return;

    const selectedPayment = paymentMethods.find(p => p.id === selectedPaymentId);
    if (!selectedPayment) return;

    try {
        localStorage.setItem('selectedProduct', JSON.stringify(selectedProduct));
        localStorage.setItem('paymentMethodName', selectedPayment.displayName);
        localStorage.setItem('selectedAppId', selectedApp); // Save the current game
        
        const checkoutUrl = selectedPayment.type === 'cc' ? '/checkout-credit-card' : '/checkout';
        router.push(`${checkoutUrl}?app=${selectedApp}`);

    } catch (e) {
        console.error("Failed to access localStorage", e);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível iniciar o checkout. Verifique as permissões do seu navegador.",
        });
    }
};


  const handleSocialLoginClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSocialLoginAlertOpen(true);
  };

  const handleFreeItemClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsFreeItemModalOpen(true);
  }

  const avatarIcon = showDeltaForceContent ? 'https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png' : 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png';


  return (
    <div className="flex flex-col min-h-screen">
      <Header avatarIcon={avatarIcon}/>
      <main className="flex flex-1 flex-col">
        <div className="mb-5 flex h-full flex-col md:mb-12">
          <ImageCarousel />
          <GameSelection />
          {showFreeFireContent && (
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
                    
                   <div className="bg-gray-100 rounded-lg p-4 mx-2 my-4 lg:mx-0 relative overflow-hidden md:max-w-[464px] flex items-center" style={{
                       backgroundImage: "url('https://i.ibb.co/YFqTtRSJ/freefire-freeitem-bg-light-3457641a.png')",
                       backgroundRepeat: 'no-repeat',
                       backgroundPosition: 'center',
                       backgroundSize: 'contain',
                       height: '98px'
                   }}>
                      <div className="flex items-center justify-between w-full">
                          <div className="item">
                              <h3 className="font-bold text-lg text-gray-800">Item Grátis</h3>
                              <p className="text-sm text-gray-600">Resgate aqui seus itens exclusivos grátis</p>
                              <Button
                                  variant="destructive"
                                  className="mt-3"
                                  style={{ width: '80px', height: '28px' }}
                                  onClick={handleFreeItemClick}
                                  disabled={!isLoggedIn}
                              >
                                  Resgatar
                              </Button>
                          </div>
                          <div className="flex-shrink-0 text-center">
                              <Image
                                  src="https://i.postimg.cc/KRYGcBrV/cubomagic.png"
                                  alt="Cubo Mágico"
                                  width={60}
                                  height={60}
                                  className="mx-auto rounded-md"
                                  data-ai-hint="magic cube"
                              />
                              <span className="text-xs text-gray-700 mt-1 inline-flex items-center gap-1">
                                  Cubo mágico
                                  <InfoIcon />
                              </span>
                          </div>
                      </div>
                  </div>

                  <div className="flex flex-col gap-9 px-2 lg:px-0">
                    {/* Login Section */}
                    <div id="login-section" className={cn("group md:max-w-[464px]", isLoading && "loading")}>
                      {isLoggedIn ? (
                        <>
                          <div className="mb-3 flex items-center gap-2 text-lg/none text-gray-800 md:text-xl/none">
                            <StepMarker number="1" />
                            <span className="font-bold">Conta</span>
                            <button onClick={() => setIsLogoutAlertOpen(true)} type="button" className="ms-auto flex items-center text-sm/none text-[#d81a0d] transition-opacity hover:opacity-70 group-[.loading]:pointer-events-none group-[.loading]:opacity-50">
                              <SwitchAccountIcon />
                              Sair
                            </button>
                          </div>
                          <div className="group-[.loading]:pointer-events-none group-[.loading]:opacity-50">
                            <div className="relative flex items-center rounded-md p-3 bg-[#f4f4f4]">
                              <div className="me-3 h-9 w-9 shrink-0 overflow-hidden rounded-full">
                                <Image className="block h-full w-full object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png" width={36} height={36} alt="Free Fire Icon" data-ai-hint="game icon" />
                              </div>
                              <div className="flex-1">
                                <div className="mb-1 text-base/none font-medium">
                                  <span className="font-medium">Usuário:</span> {playerName}
                                </div>
                                <div className="mt-2 text-xs/none text-gray-500">ID do jogador: {playerId}</div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-3 flex items-center gap-2 text-lg/none text-gray-800 md:text-xl/none">
                            <StepMarker number="1" />
                            <span className="font-bold">Login</span>
                          </div>
                          <div className={cn("relative bg-[#f4f4f4] p-4 border border-gray-200 rounded-md")}>
                            <form onSubmit={handleLogin} className="mb-4">
                              <label className="mb-2 flex items-center gap-1 text-[15px]/4 font-medium text-gray-800" htmlFor="player-id">
                                ID do jogador
                                <button type="button" className="rounded-full text-sm text-gray-500 transition-opacity hover:opacity-70">
                                  <InfoIcon />
                                </button>
                              </label>
                              <div className="flex">
                                <Popover open={!isMobile && isHistoryPopoverOpen} onOpenChange={setIsHistoryPopoverOpen}>
                                  
                                    <div className="relative grow">
                                      <Input
                                        id="player-id"
                                        className="w-full bg-white/600 pr-10 rounded-r-none focus:outline-none focus:ring-0 focus:border-transparent !ring-0 !border-transparent"
                                        type="text"
                                        pattern="\d*"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        placeholder="Insira o ID de jogador aqui"
                                        value={playerId}
                                        onChange={(e) => setPlayerId(e.target.value.replace(/\D/g, ''))}
                                      />
                                      {history.length > 0 && (
                                        <>
                                          {isMobile ? (
                                            <Sheet open={isHistoryPopoverOpen} onOpenChange={setIsHistoryPopoverOpen}>
                                              <SheetTrigger asChild>
                                                <button type="button" className="absolute end-2 top-1/2 block -translate-y-1/2 text-lg transition-all hover:opacity-70" aria-label="Histórico de Contas">
                                                  <ChevronLeft className="h-5 w-5 rotate-[-90deg]" />
                                                </button>
                                              </SheetTrigger>
                                              <HistoryPopover
                                                  history={history}
                                                  onClose={() => setIsHistoryPopoverOpen(false)}
                                                  onSelect={(id) => performLogin(id)}
                                                  onRemove={(id) => removeFromHistory(id)}
                                              />
                                            </Sheet>
                                          ) : (
                                            <PopoverTrigger asChild>
                                              <button type="button" className="absolute end-2 top-1/2 block -translate-y-1/2 text-lg transition-all hover:opacity-70" aria-label="Histórico de Contas">
                                                <ChevronLeft className={cn("h-5 w-5 transition-transform", isHistoryPopoverOpen ? "rotate-[-90deg]" : "rotate-0")} />
                                              </button>
                                            </PopoverTrigger>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  
                                  {!isMobile && history.length > 0 && (
                                      <HistoryPopover
                                          history={history}
                                          onClose={() => setIsHistoryPopoverOpen(false)}
                                          onSelect={(id) => performLogin(id)}
                                          onRemove={(id) => removeFromHistory(id)}
                                      />
                                  )}
                                </Popover>
                                <Button type="submit" variant="destructive" className="rounded-l-none" disabled={!playerId.trim() || isLoading}>
                                  {isLoading ? 'Aguarde...' : 'Login'}
                                </Button>
                              </div>
                              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                            </form>
                            <div className="flex items-center gap-4 text-xs/normal text-gray-500 md:text-sm/[22px]">
                              <span className="me-auto">Ou entre com sua conta de jogo</span>
                              <button type="button" onClick={handleSocialLoginClick} className="shrink-0 rounded-full p-1.5 transition-opacity hover:opacity-70 bg-[#006AFC]">
                                <Image width={20} height={20} className="h-5 w-5 brightness-0 invert" src="https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/ic-fb-485c92b0.svg" alt="Facebook logo" data-ai-hint="social media logo" />
                              </button>
                              <button type="button" onClick={handleSocialLoginClick} className="shrink-0 rounded-full p-1.5 transition-opacity hover:opacity-70 border border-gray-200 bg-white">
                                <Image width={20} height={20} className="h-5 w-5" src="https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/ic-google-d2ceaa95.svg" alt="Google logo" data-ai-hint="social media logo" />
                              </button>
                              <button type="button" onClick={handleSocialLoginClick} className="shrink-0 rounded-full p-1.5 transition-opacity hover:opacity-70 border border-gray-200 bg-white">
                                <Image width={20} height={20} className="h-5 w-5" src="https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/ic-twitter-92527e61.svg" alt="Twitter logo" data-ai-hint="social media logo" />
                              </button>
                              <button type="button" onClick={handleSocialLoginClick} className="shrink-0 rounded-full p-1.5 transition-opacity hover:opacity-70 bg-[#0077FF]">
                                <Image width={20} height={20} className="h-5 w-5 brightness-0 invert" src="https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/ic-vk-abadf989.svg" alt="VK logo" data-ai-hint="social media logo" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Denomination Section */}
                    <div>
                      <div id="denom-section" className="mb-3 flex scroll-mt-16 items-center gap-2 text-lg/none font-bold text-gray-800 md:text-xl/none">
                        <StepMarker number="2" />
                        Valor de Recarga
                      </div>
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
                                "group relative flex flex-col min-h-[50px] cursor-pointer overflow-hidden rounded-md bg-white p-0 sm:min-h-[64px] md:min-h-[72px] border border-gray-200 outline-none transition-all",
                                "focus-visible:ring-2 focus-visible:ring-ring",
                                isSelected && "ring-2 ring-destructive"
                                )}
                            >
                                <div className="flex flex-1 items-center justify-center p-1">
                                    <Image className="me-1 h-3 w-3 object-contain md:h-4 md:w-4" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={16} height={16} alt="Diamante" data-ai-hint="diamond gem" />
                                    <span className="text-xs/none md:text-lg/none">{pack.originalAmount}</span>
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
                                isSelected && "ring-2 ring-destructive"
                              )}
                            >
                              <div className="relative mb-2 w-full overflow-hidden rounded-sm pt-[56.25%]">
                                <Image className="pointer-events-none absolute inset-0 h-full w-full object-cover" src={offer.image} sizes="(max-width: 768px) 50vw, 25vw" fill alt={offer.name} data-ai-hint="game offer" />
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="line-clamp-2 text-center text-sm/[18px] font-medium">{offer.name}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Payment Method Section */}
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
                          const selectedProduct = getAllRechargeOptions().find(p => p.id === selectedRechargeId);

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
                                isSelected && "border-destructive bg-destructive/5"
                              )}
                            >
                              <div className="shrink-0">
                                <Image className="pointer-events-none h-[60px] w-[60px] object-contain object-left md:h-14 md:w-14" src={method.image} width={75} height={75} alt={method.name} data-ai-hint="payment logo" />
                              </div>
                              {showPriceAndBonus && selectedProduct && (
                                <div className="flex w-full flex-col flex-wrap gap-y-1 font-medium md:gap-y-2 text-sm/none md:text-base/none">
                                  <div className="flex flex-wrap gap-x-0.5 gap-y-1 whitespace-nowrap md:flex-col">
                                    <span className="items-center inline-flex font-bold text-gray-800">{selectedProduct.formattedPrice}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-y-1 empty:hidden md:gap-y-2">
                                    <span className="inline-flex items-center text-xs/none text-primary md:text-sm/none">
                                      + Bônus <Image className="mx-1 h-3 w-3 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={12} height={12} alt="Diamante" data-ai-hint="diamond gem" />
                                      {selectedProduct.bonusAmount}
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
          )}
          {showDeltaForceContent && (
            <DeltaForceContent
              isLoggedIn={isLoggedIn}
              isLoading={isLoading}
              error={error}
              playerId={playerId}
              setPlayerId={setPlayerId}
              handleLogin={handleLogin}
              handleLogout={() => setIsLogoutAlertOpen(true)}
              onSocialLoginClick={handleSocialLoginClick}
              selectedRechargeId={selectedRechargeId}
              selectedPaymentId={selectedPaymentId}
              onRechargeSelect={handleRechargeSelection}
              onPaymentSelect={handlePaymentSelection}
              onSelectionKeyDown={handleSelectionKeyDown}
              history={history}
              isHistoryPopoverOpen={isHistoryPopoverOpen}
              setIsHistoryPopoverOpen={setIsHistoryPopoverOpen}
              performLogin={performLogin}
              removeFromHistory={removeFromHistory}
            />
          )}
        </div>
        <div className="z-[9] pointer-events-none sticky bottom-0"></div>
      </main>
      {(showFreeFireContent || showDeltaForceContent) && <PurchaseFooter selectedRechargeId={selectedRechargeId} selectedPaymentId={selectedPaymentId} onPurchase={handlePurchase} gameId={selectedApp} />}
      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent className="max-w-[320px] rounded-lg p-6">
          <AlertDialogHeader className="text-justfy center space-y-3">
            <AlertDialogTitle>Não é sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, saia e faça login com sua outra conta
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-4 pt-2">
            <AlertDialogCancel className="w-full mt-0 border-[#d81a0d] text-[#d81a0d] hover:text-[#d8716b]/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleLogout(true)} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isSocialLoginAlertOpen} onOpenChange={setIsSocialLoginAlertOpen}>
        <AlertDialogContent className="max-w-[320px] rounded-lg p-6">
          <AlertDialogHeader className="text-center space-y-3">
            <AlertDialogTitle>Serviço indisponível</AlertDialogTitle>
            <AlertDialogDescription>
              Use seu ID do jogo para entrar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsSocialLoginAlertOpen(false)} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isFreeItemModalOpen} onOpenChange={setIsFreeItemModalOpen}>
        <AlertDialogContent className="max-w-xs rounded-lg p-6">
          <AlertDialogHeader className="text-center space-y-4">
              <div className="text-center">
                  <Gift className="h-10 w-10 text-destructive inline-block" />
              </div>
              <AlertDialogTitle className="text-xl">Quase lá para o seu Item Grátis!</AlertDialogTitle>
              <AlertDialogDescription className="text-base text-gray-600">
                Para receber o seu <strong>Cubo Mágico</strong>, finalize sua compra e ele será adicionado automaticamente junto com seus diamantes!
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
              <AlertDialogAction onClick={() => setIsFreeItemModalOpen(false)} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-lg h-11">
                  OK
              </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </div>
  );
}


export default function HomePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <HomePageContent />
    </Suspense>
  )
}
 
    