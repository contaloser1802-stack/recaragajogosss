'use client';

import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { type FormEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Trash2, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameSelection } from '@/components/freefire/GameSelection';
import { diamondPacks, specialOffers, paymentMethods } from '@/lib/data';

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

const InfoIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#recharge_clip0_489_1601)"><path d="M4.8999 5.39848C4.89981 4.44579 5.67209 3.67344 6.62478 3.67344H7.37471C8.33038 3.67344 9.09977 4.45392 9.09971 5.40371C9.09967 6.05546 8.73195 6.65677 8.14619 6.94967L7.57416 7.23571C7.49793 7.27382 7.44978 7.35173 7.44978 7.43695V7.49844C7.44978 7.78839 7.21473 8.02344 6.92478 8.02344C6.63483 8.02344 6.39978 7.78839 6.39978 7.49844V7.43695C6.39978 6.95403 6.67262 6.51255 7.10456 6.29657L7.6766 6.01053C7.90385 5.8969 8.0497 5.66087 8.04971 5.40365C8.04973 5.0279 7.74459 4.72344 7.37471 4.72344H6.62478C6.25203 4.72344 5.94987 5.02563 5.9499 5.39838C5.94993 5.68833 5.7149 5.9234 5.42495 5.92343C5.135 5.92346 4.89993 5.68843 4.8999 5.39848Z" fill="currentColor"></path><path d="M6.9999 10.1484C7.3865 10.1484 7.6999 9.83504 7.6999 9.44844C7.6999 9.06184 7.3865 8.74844 6.9999 8.74844C6.6133 8.74844 6.2999 9.06184 6.2999 9.44844C6.2999 9.83504 6.6133 10.1484 6.9999 10.1484Z" fill="currentColor"></path><path fillRule="evenodd" clipRule="evenodd" d="M0.524902 6.99844C0.524902 3.42239 3.42386 0.523438 6.9999 0.523438C10.5759 0.523438 13.4749 3.42239 13.4749 6.99844C13.4749 10.5745 10.5759 13.4734 6.9999 13.4734C3.42386 13.4734 0.524902 10.5745 0.524902 6.99844ZM6.9999 1.57344C4.00376 1.57344 1.5749 4.00229 1.5749 6.99844C1.5749 9.99458 4.00376 12.4234 6.9999 12.4234C9.99605 12.4234 12.4249 9.99458 12.4249 6.99844C12.4249 4.00229 9.99605 1.57344 6.9999 1.57344Z" fill="currentColor"></path></g>
    <defs><clipPath id="recharge_clip0_489_1601"><rect width="14" height="14" fill="currentColor"></rect></clipPath></defs>
  </svg>
);

const SwitchAccountIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-1">
    <path fillRule="evenodd" clipRule="evenodd" d="M53.048 11.8069C51.8367 10.6764 49.9383 10.7418 48.8078 11.953C47.6773 13.1643 47.7428 15.0626 48.954 16.1932L58.3898 25H14.0007C12.3439 25 11.0007 26.3432 11.0007 28C11.0007 29.6569 12.3439 31 14.0007 31H66.0007C67.233 31 68.3399 30.2465 68.7917 29.1001C69.2436 27.9538 68.9485 26.6476 68.0477 25.8069L53.048 11.8069ZM26.9539 68.1932C28.1652 69.3237 30.0636 69.2582 31.1941 68.0469C32.3245 66.8356 32.259 64.9373 31.0477 63.8068L21.6114 55H66.0001C67.657 55 69.0001 53.6569 69.0001 52C69.0001 50.3432 67.657 49 66.0001 49H14.0001C12.7679 49 11.6609 49.7535 11.2091 50.8999C10.7572 52.0464 11.0524 53.3525 11.9532 54.1932L26.9539 68.1932Z" fill="currentColor"></path>
  </svg>
);

const NavButton = ({ direction, onClick }: { direction: 'prev' | 'next', onClick: () => void }) => {
  const isPrev = direction === 'prev';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 z-10 hidden md:block',
        isPrev ? 'left-4' : 'right-4'
      )}
    >
      {isPrev ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
    </button>
  );
};


const ImageCarousel = () => {
  const banners = useMemo(() => [
    { src: 'https://contentgarena-a.akamaihd.net/GOP/newshop_banners/100067br-JAN22-pc.png?v=1750094508', alt: 'Banner 1' },
    { src: 'https://contentgarena-a.akamaihd.net/GOP/newshop_banners/26B06340B596B357.png?v=1729016596', alt: 'Banner 2' },
    { src: 'https://contentgarena-a.akamaihd.net/GOP/newshop_banners/47BED91C7ABCF1EA.png?v=1750167188', alt: 'Banner 3' },
  ], []);

  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loopedBanners = useMemo(() => {
    if (banners.length === 0) return [];
    const first = banners[0];
    const last = banners[banners.length - 1];
    return [last, ...banners, first];
  }, [banners]);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setCurrentIndex(prev => prev + 1);
  }, [isTransitioning]);

  const handlePrev = () => {
    if (isTransitioning) return;
    setCurrentIndex(prev => prev - 1);
  };

  const handleDotClick = (index: number) => {
    if (isTransitioning) return;
    setCurrentIndex(index + 1);
  };

  const handleTransitionEnd = useCallback(() => {
    if (currentIndex <= 0) {
      setIsTransitioning(true);
      setCurrentIndex(banners.length);
    } else if (currentIndex >= banners.length + 1) {
      setIsTransitioning(true);
      setCurrentIndex(1);
    }
  }, [currentIndex, banners.length]);

  // Auto-play
  useEffect(() => {
    resetTimeout();
    if (!isTransitioning) {
      timeoutRef.current = setTimeout(handleNext, 3000);
    }
    return () => {
      resetTimeout();
    };
  }, [currentIndex, isTransitioning, handleNext, resetTimeout]);

  // Re-enable transitions after the jump
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  return (
    <div className="bg-[#151515]">
      <div className="mx-auto w-full max-w-[900px] py-2.5 lg:py-5">
        <div className="relative overflow-hidden">
          <div
            className="flex"
            onTransitionEnd={handleTransitionEnd}
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: isTransitioning ? 'none' : 'transform 500ms ease-in-out',
            }}
          >
            {loopedBanners.map((banner, index) => (
              <div key={index} className="relative w-full flex-shrink-0 pt-[37.77%]">
                <Image
                  className="absolute inset-0 h-full w-full object-cover md:rounded-xl"
                  src={banner.src}
                  alt={banner.alt}
                  fill
                  priority={index > 0 && index <= banners.length}
                  data-ai-hint="game banner"
                />
              </div>
            ))}
          </div>

          <NavButton direction="prev" onClick={() => { resetTimeout(); handlePrev(); }} />
          <NavButton direction="next" onClick={() => { resetTimeout(); handleNext(); }} />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={cn(
                  "h-2 w-2 cursor-pointer rounded-full transition-colors",
                  (currentIndex === index + 1 || (currentIndex === 0 && index === banners.length - 1) || (currentIndex === banners.length + 1 && index === 0)) ? 'bg-destructive' : 'bg-white/50'
                )}
                aria-label={`Go to slide ${index + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PurchaseFooter = ({ selectedRechargeId, selectedPaymentId, onPurchase }: { selectedRechargeId: string | null; selectedPaymentId: string | null; onPurchase: () => void; }) => {
  if (!selectedRechargeId) {
    return null;
  }

  const allItems = [...diamondPacks, ...specialOffers];
  const selectedItem = allItems.find(item => item.id === selectedRechargeId);

  if (!selectedItem) {
    return null;
  }

  const isPurchaseDisabled = !selectedPaymentId;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
      <div className="pointer-events-auto relative mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4 md:justify-end md:gap-10 lg:px-10">
        <div className="flex flex-col md:items-end">
          <div className="flex items-center gap-1 text-sm/none font-bold md:text-end md:text-base/none">
            <>
              <Image className="h-4 w-4 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={16} height={16} alt="Diamante" data-ai-hint="diamond gem" />
              <span dir="ltr">{selectedItem.originalAmount} + {selectedItem.bonusAmount}</span>
            </>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm/none md:text-end md:text-base/none">
            <span className="font-medium text-gray-600">Total:</span>
            <span className="font-bold text-destructive">{selectedItem.formattedPrice}</span>
          </div>
        </div>
        <Button className="px-5 text-base font-bold h-11" variant="destructive" disabled={isPurchaseDisabled} onClick={onPurchase}>
          <ShieldCheckIcon />
          Compre agora
        </Button>
      </div>
    </div>
  );
};

export default function HomePage() {
  const router = useRouter();
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

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('playerHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      const storedPlayerName = localStorage.getItem('playerName');
      const storedPlayerId = localStorage.getItem('playerId');
      if (storedPlayerName && storedPlayerId) {
        setPlayerName(storedPlayerName);
        setPlayerId(storedPlayerId);
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error("Failed to access localStorage", e);
    }
  }, []);

  const updateHistory = useCallback((newItem: LoginHistoryItem) => {
    setHistory(prevHistory => {
      const otherAccounts = prevHistory.filter(item => item.id !== newItem.id);
      const newHistory = [newItem, ...otherAccounts].slice(0, 5);
      try {
        localStorage.setItem('playerHistory', JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to access localStorage", e);
      }
      return newHistory;
    });
  }, []);

  const removeFromHistory = (idToRemove: string) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item.id !== idToRemove);
      try {
        localStorage.setItem('playerHistory', JSON.stringify(newHistory));
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

    try {
      const response = await fetch(`/api/player-lookup?uid=${id}`);
      const data = await response.json();

      if (response.ok && data.nickname) {
        const nickname = data.nickname;
        setPlayerName(nickname);
        setIsLoggedIn(true);
        localStorage.setItem('playerName', nickname);
        localStorage.setItem('playerId', id);
        updateHistory({ id: id, name: nickname });
        setIsHistoryPopoverOpen(false);
      } else {
        setError(data.error || 'ID de jogador não encontrado.');
        localStorage.removeItem('playerName');
        localStorage.removeItem('playerId');
        setIsLoggedIn(false);
        setPlayerName('');
      }
    } catch (err) {
      setError('Erro ao buscar jogador. Tente novamente.');
      localStorage.removeItem('playerName');
      localStorage.removeItem('playerId');
      setIsLoggedIn(false);
      setPlayerName('');
    } finally {
      setIsLoading(false);
    }
  }, [updateHistory]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    await performLogin(playerId);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPlayerName('');
    setPlayerId('');
    setError('');
    setSelectedRechargeId(null);
    setSelectedPaymentId(null);
    localStorage.removeItem('playerName');
    localStorage.removeItem('playerId');
    setIsLogoutAlertOpen(false);
  };

  const allRechargeOptions = [...diamondPacks, ...specialOffers];

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

    const selectedProduct = allRechargeOptions.find(p => p.id === selectedRechargeId);
    if (!selectedProduct) return;

    const selectedPayment = paymentMethods.find(p => p.id === selectedPaymentId);
    if (!selectedPayment) return;

    try {
        localStorage.setItem('selectedProduct', JSON.stringify(selectedProduct));
        localStorage.setItem('paymentMethodName', selectedPayment.displayName);
        if (selectedPayment.type === 'cc') {
          router.push('/checkout-credit-card');
        } else {
          router.push('/checkout');
        }
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

  const HistoryPopoverContent = () => (
    <>
      {isMobile ? (
        <div className="relative p-4 border-b">
          <button
            onClick={() => setIsHistoryPopoverOpen(false)}
            className="absolute inset-y-0 start-4 my-auto h-fit text-2xl text-gray-500 transition-opacity hover:opacity-70"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-center text-lg/none font-medium text-gray-800">Select Player ID</h3>
        </div>
      ) : (
        <div className="p-4 border-b">
          <h3 className="text-center text-lg/none font-medium text-gray-800">Select Player ID</h3>
        </div>
      )}
      <ul className="md:p-1">
        {history.map(item => (
          <li key={item.id} className="flex items-center py-3 max-md:mx-4 max-md:border-b md:px-4">
            <div
              className="flex-1 flex items-center cursor-pointer"
              onClick={() => performLogin(item.id)}
            >
              <div className="me-3 h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <Image className="block h-full w-full object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png" width={40} height={40} alt="Free Fire Icon" data-ai-hint="game icon" />
              </div>
              <div className="flex-1">
                <div className="mb-2 text-base/none font-medium">{item.name}</div>
                <div className="text-xs/none text-gray-500">ID do jogador: {item.id}</div>
              </div>
            </div>
            <Button onClick={() => removeFromHistory(item.id)} variant="ghost" size="icon" className="ms-4 text-gray-400 hover:text-destructive active:opacity-60" aria-label={`Remover ${item.name} do histórico`}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="mb-5 flex h-full flex-col md:mb-12">
          <ImageCarousel />
          <GameSelection />
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
                              <div className="line-clamp-2 text-sm/none font-bold text-gray-800">Usuário: {playerName}</div>
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
                                <PopoverAnchor asChild>
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
                                            <SheetContent side="bottom" className="p-0 gap-0 rounded-t-lg">
                                              <HistoryPopoverContent />
                                            </SheetContent>
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
                                </PopoverAnchor>
                                {!isMobile && history.length > 0 && (
                                  <PopoverContent className="p-0" side="bottom" align="start" style={{ width: 'var(--radix-popover-anchor-width)' }}>
                                    <HistoryPopoverContent />
                                  </PopoverContent>
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
                                  <span className="text-sm/none font-medium md:text-lg/none max-[350px]:text-xs/none">{pack.originalAmount}</span>
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
                        const selectedProduct = allRechargeOptions.find(p => p.id === selectedRechargeId);

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
        </div>
        <div className="z-[9] pointer-events-none sticky bottom-0"></div>
      </main>
      <PurchaseFooter selectedRechargeId={selectedRechargeId} selectedPaymentId={selectedPaymentId} onPurchase={handlePurchase} />
      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent className="max-w-[320px] rounded-lg p-6">
          <AlertDialogHeader className="text-justfy center space-y-3">
            <AlertDialogTitle className="text-base font-bold">Não é sua conta?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500">
              Por favor, saia e faça login com sua outra conta
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-4 pt-2">
            <AlertDialogCancel className="w-full mt-0 border-[#d81a0d] text-[#d81a0d] hover:text-[#d8716b]/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
      <Footer />
    </div>
  );
}
