'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { deltaForcePacks, deltaForceSpecialOffers, paymentMethods } from '@/lib/data';
import { ShieldCheckIcon, StepMarker, InfoIcon, SwitchAccountIcon } from '@/components/freefire/Icons';


export function DeltaForceContent() {
    const [playerId, setPlayerId] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [playerName, setPlayerName] = useState('JogadorDelta'); // Placeholder

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerId) {
            setError('Por favor, insira um ID de jogador.');
            return;
        }
        setIsLoading(true);
        setError('');
        // Simula uma chamada de API
        setTimeout(() => {
            setPlayerName(`Jogador${playerId.slice(0, 5)}`);
            setIsLoggedIn(true);
            setIsLoading(false);
        }, 500);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setPlayerId('');
        setPlayerName('');
        setError('');
    };


    return (
        <div className="bg-white">
            <div className="mx-auto max-w-5xl p-2 pb-4 lg:px-10 lg:pt-9">
                <div className="mb-5 lg:mb-[28px]">
                    <div className="relative flex items-center overflow-hidden transition-all">
                        <div className="absolute h-full w-full rounded-t-lg bg-[#BDBDC5] bg-cover bg-center rtl:-scale-x-100 lg:rounded-lg" style={{ backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/DF-4dc01e48.jpg')" }}></div>
                        <div className="relative flex items-center p-4 lg:p-6">
                            <Image className="h-11 w-11 lg:h-[72px] lg:w-[72px]" src="https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png" width={72} height={72} alt="Delta Force Icon" data-ai-hint="game icon" />
                            <div className="ms-3 flex flex-col items-start lg:ms-5">
                                <div className="mb-1 text-base/none font-bold text-white lg:text-2xl/none">Delta Force</div>
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
                            <button onClick={handleLogout} type="button" className="ms-auto flex items-center text-sm/none text-[#d81a0d] transition-opacity hover:opacity-70 group-[.loading]:pointer-events-none group-[.loading]:opacity-50">
                              <SwitchAccountIcon />
                              Sair
                            </button>
                          </div>
                          <div className="group-[.loading]:pointer-events-none group-[.loading]:opacity-50">
                            <div className="relative flex items-center rounded-md p-3 bg-[#f4f4f4]">
                              <div className="me-3 h-9 w-9 shrink-0 overflow-hidden rounded-full">
                                <Image className="block h-full w-full object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png" width={36} height={36} alt="Delta Force Icon" data-ai-hint="game icon" />
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
                              <label className="mb-2 flex items-center gap-1 text-[15px]/4 font-medium text-gray-800" htmlFor="df-player-id">
                                ID do jogador
                                <button type="button" className="rounded-full text-sm text-gray-500 transition-opacity hover:opacity-70">
                                  <InfoIcon />
                                </button>
                              </label>
                              <div className="flex">
                                <div className="relative grow">
                                  <Input
                                    id="df-player-id"
                                    className="w-full bg-white pr-10 rounded-r-none"
                                    type="text"
                                    placeholder="Insira o ID de jogador aqui"
                                    value={playerId}
                                    onChange={(e) => setPlayerId(e.target.value)}
                                  />
                                </div>
                                <Button type="submit" variant="destructive" className="rounded-l-none" disabled={isLoading}>
                                  {isLoading ? 'Aguarde...' : 'Login'}
                                </Button>
                              </div>
                              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                            </form>
                            <div className="flex items-center gap-4 text-xs/normal text-gray-500 md:text-sm/[22px]">
                              <span className="me-auto">Ou entre com sua conta de jogo</span>
                               <a className="shrink-0 rounded-full p-1.5 transition-opacity hover:opacity-70 outline outline-1 -outline-offset-1 outline-gray-200 bg-white" href="#">
                                <Image width={20} height={20} className="h-5 w-5" src="https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/ic-garena-2fce3e76.svg" alt="Garena logo" data-ai-hint="social media logo" />
                               </a>
                              <a className="shrink-0 rounded-full p-1.5 transition-opacity hover:opacity-70 bg-[#006AFC]" href="#">
                                <Image width={20} height={20} className="h-5 w-5 brightness-0 invert" src="https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/ic-fb-485c92b0.svg" alt="Facebook logo" data-ai-hint="social media logo" />
                              </a>
                              <a className="shrink-0 rounded-full p-1.5 transition-opacity hover:opacity-70 outline outline-1 -outline-offset-1 outline-gray-200 bg-white" href="#">
                                <Image width={20} height={20} className="h-5 w-5" src="https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/ic-google-d2ceaa95.svg" alt="Google logo" data-ai-hint="social media logo" />
                              </a>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Denomination Section */}
                     <div>
                      <div className="mb-3 flex scroll-mt-16 items-center gap-2 text-lg/none font-bold text-gray-800 md:text-xl/none">
                        <StepMarker number="2" />
                        Valor de Recarga
                      </div>
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 md:gap-4">
                        {deltaForcePacks.map((pack) => (
                            <div key={pack.id} className="group relative flex min-h-[50px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md bg-gray-100 p-1 sm:min-h-[64px] md:min-h-[72px] border border-gray-200 outline-none transition-all hover:border-destructive">
                              <div className="absolute end-1.5 top-1.5 rounded-sm bg-destructive px-1 py-0.5 text-xs font-bold text-white">
                                +{pack.bonusAmount}
                              </div>
                              <div className="flex flex-1 items-center">
                                <Image className="me-1 h-3 w-3 object-contain md:h-4 md:w-4" src="https://cdn-gop.garenanow.com/gop/app/0000/100/151/point.png" width={16} height={16} alt="Delta Coin" data-ai-hint="coin"/>
                                <span className="text-sm/none font-medium md:text-lg/none max-[350px]:text-xs/none">{pack.originalAmount}</span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                      <div className="my-4 flex items-center">
                        <div className="text-base/none font-bold text-gray-500">Ofertas especiais</div>
                        <hr className="ms-2 grow border-gray-300" />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
                          {deltaForceSpecialOffers.map((offer) => (
                            <div key={offer.id} className="group peer relative flex h-full cursor-pointer flex-col items-center rounded-md bg-gray-100 p-1.5 pb-2 border border-gray-200 hover:border-destructive">
                              <div className="relative mb-2 w-full overflow-hidden rounded-sm pt-[56.25%]">
                                <Image className="pointer-events-none absolute inset-0 h-full w-full object-cover" src={offer.image} fill sizes="(max-width: 768px) 50vw, 25vw" alt={offer.name} data-ai-hint="game item"/>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="line-clamp-2 text-center text-sm/[18px] font-medium">{offer.name}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Payment Method Section */}
                     <div>
                      <div className="mb-3 flex scroll-mt-36 items-center gap-2 text-lg/none font-bold text-gray-800 md:text-xl/none">
                        <StepMarker number="3" />
                        <div>Método de pagamento</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4">
                        {paymentMethods.map((method) => (
                            <div key={method.id} className="group relative flex h-full min-h-[80px] cursor-pointer items-start gap-2 rounded-md border border-gray-200 bg-gray-100 p-2.5 transition-all hover:border-destructive max-md:flex-col max-md:justify-between md:items-center md:gap-3 md:p-3">
                              <div className="shrink-0">
                                <Image className="pointer-events-none h-[60px] w-[60px] object-contain object-left md:h-14 md:w-14" src={method.image} width={75} height={75} alt={method.name} data-ai-hint="payment logo"/>
                              </div>
                              <div className="absolute end-[3px] top-[3px] overflow-hidden rounded-[3px]">
                                <div className="flex text-[10px] font-bold uppercase leading-none">
                                  <div className="flex items-center gap-1 bg-destructive p-0.5 pr-1 text-white">
                                    <Image
                                      className="h-3 w-3 rounded-sm bg-white object-contain p-0.5"
                                      src="https://cdn-gop.garenanow.com/gop/app/0000/100/151/point.png"
                                      width={12}
                                      height={12}
                                      alt="Promo"
                                    />
                                    <span>Promo</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
