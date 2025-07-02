
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const games = [
    {
        id: 'ff',
        name: 'Free Fire',
        icon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png',
    },
    {
        id: 'df',
        name: 'Delta Force',
        icon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png'
    }
];

const CheckmarkIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full origin-top-left scale-[45%] text-white rtl:origin-top-right md:scale-[45.714%]">
        <path fillRule="evenodd" clipRule="evenodd" d="M0.683616 3.34767C0.966833 3.06852 1.41058 3.02521 1.74384 3.24419L4.84892 5.28428L11.2468 0.49236C11.5616 0.256548 12.0047 0.286191 12.2843 0.561764C12.5639 0.837337 12.594 1.27411 12.3548 1.58439L6.77224 8.82375C6.70207 8.92749 6.62168 9.02414 6.53224 9.1123C5.82037 9.81394 4.68878 9.84975 3.93408 9.21971L3.77319 9.07952C3.75044 9.05904 3.72815 9.03804 3.70636 9.01656C3.5095 8.82253 3.36114 8.59882 3.26127 8.36003L0.578633 4.39267C0.35646 4.06419 0.4004 3.62682 0.683616 3.34767Z" fill="currentColor"></path>
    </svg>
);


const DecorativeBanner = () => {
    return (
        <div className="pointer-events-none absolute inset-0 flex">
            <div className="h-[7px] flex-1 bg-[#F2B13E]"></div>
            <svg width="390" height="27" viewBox="0 0 390 27" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[27px] md:hidden" preserveAspectRatio="none">
                <path d="M390 0H0V7H285L301 27H390V0Z" fill="url(#paint0_linear_2330_34259_mobile)"></path>
                <defs>
                    <linearGradient id="paint0_linear_2330_34259_mobile" x1="-9" y1="7.61906" x2="387.828" y2="41.0361" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F2B13E"></stop>
                        <stop offset="1" stopColor="#FDD373" stopOpacity="0.63"></stop>
                    </linearGradient>
                </defs>
            </svg>
            <svg width="1024" height="27" viewBox="0 0 1024 27" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden h-[27px] md:block" preserveAspectRatio="none">
                <path d="M1024 0H0V7H516L532 27H1024V0Z" fill="url(#paint0_linear_2339_34301_desktop)"></path>
                <defs>
                    <linearGradient id="paint0_linear_2339_34301_desktop" x1="222" y1="7.61902" x2="618.827" y2="41.0361" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F2B13E"></stop>
                        <stop offset="1" stopColor="#FDD373" stopOpacity="0.63"></stop>
                    </linearGradient>
                </defs>
            </svg>
            <div className="h-[27px] flex-1 bg-[#FDD373]/[0.63]"></div>
        </div>
    )
}

export function GameSelection() {
    const [selectedGame, setSelectedGame] = useState('ff');
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const handleGameClick = (gameId: string) => {
        if (gameId === 'df') {
            setIsAlertOpen(true);
        } else {
            setSelectedGame(gameId);
        }
    };

    return (
        <>
            <div className="relative bg-[#EFEFEF]">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat md:bg-contain"
                    style={{ backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/pattern-game-selection-59889447.png')" }}
                ></div>
                <DecorativeBanner />
                <div className="relative mx-auto flex max-w-5xl flex-col px-[22px] pb-[14px] pt-5 md:px-8 md:pb-4 md:pt-[27px]">
                    <h2 className="relative -ms-1.5 mb-4 text-lg/none font-bold text-gray-800 md:mb-5 md:ms-0 md:text-xl/none">
                        Seleção de jogos
                    </h2>
                    <div className="grid grid-cols-4 gap-x-[22px] gap-y-4 sm:grid-cols-6 lg:grid-cols-8">
                        {games.map(game => {
                            const isSelected = game.id === selectedGame;
                            return (
                                <div
                                    key={game.id}
                                    className="cursor-pointer outline-none"
                                    role="radio"
                                    aria-checked={isSelected}
                                    tabIndex={isSelected ? 0 : -1}
                                    onClick={() => handleGameClick(game.id)}
                                >
                                    <div className="mx-auto max-w-[70px] md:max-w-[105px]">
                                        <div className="mb-1 px-[3px] md:mb-2 md:px-2">
                                            <div className="relative">
                                                <div className={cn("relative overflow-hidden rounded-[25%] border-[3px] border-transparent transition-colors md:border-4", isSelected && "border-destructive")}>
                                                    <div className="relative pt-[100%]">
                                                        <Image className="pointer-events-none absolute inset-0 h-full w-full bg-white object-cover" src={game.icon} alt={game.name} fill data-ai-hint="game icon" />
                                                    </div>
                                                </div>
                                                <div
                                                    className={cn(
                                                        "absolute left-[-1px] top-[-1px] w-8 h-8 opacity-0 transition-opacity",
                                                        "dark:ltr:bg-[linear-gradient(-45deg,transparent_50%,#E4372E_50%)] dark:rtl:bg-[linear-gradient(45deg,transparent_50%,#E4372E_50%)]",
                                                        isSelected && "opacity-100",
                                                    )}
                                                >
                                                    <div className="absolute inset-0 origin-top-left scale-50 rounded-ss-[50%] p-[18.75%] ltr:bg-[linear-gradient(-45deg,transparent_50%,#D81A0D_50%)] rtl:origin-top-right rtl:bg-[linear-gradient(45deg,transparent_50%,#D81A0D_50%)]">
                                                      <CheckmarkIcon />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn("line-clamp-2 text-center text-xs text-gray-700 md:text-sm/[22px]", isSelected && "font-bold text-destructive")}>
                                            {game.name}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent className="max-w-[320px] rounded-lg p-6">
                    <AlertDialogHeader className="text-center space-y-3">
                        <AlertDialogTitle>Serviço indisponível</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsAlertOpen(false)} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

