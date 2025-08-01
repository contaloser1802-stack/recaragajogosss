
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';


const games = [
    {
        id: 'ff',
        appId: '100067',
        name: 'Free Fire',
        icon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png',
    },
    {
        id: 'df',
        appId: '100151',
        name: 'Delta Force',
        icon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/151/icon.png'
    },
    {
        id: 'hq',
        appId: '100153',
        name: 'HAIKYU!! FLY HIGH',
        icon: 'https://cdn-gop.garenanow.com/gop/app/0000/100/153/icon.png',
    }
];

const CheckmarkIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full origin-top-left scale-[45%] text-white rtl:origin-top-right md:scale-[45.714%]">
        <path fillRule="evenodd" clipRule="evenodd" d="M0.683616 3.34767C0.966833 3.06852 1.41058 3.02521 1.74384 3.24419L4.84892 5.28428L11.2468 0.49236C11.5616 0.256548 12.0047 0.286191 12.2843 0.561764C12.5639 0.837337 12.594 1.27411 12.3548 1.58439L6.77224 8.82375C6.70207 8.92749 6.62168 9.02414 6.53224 9.1123C5.82037 9.81394 4.68878 9.84975 3.93408 9.21971L3.77319 9.07952C3.75044 9.05904 3.72815 9.03804 3.70636 9.01656C3.5095 8.82253 3.36114 8.59882 3.26127 8.36003L0.578633 4.39267C0.35646 4.06419 0.4004 3.62682 0.683616 3.34767Z" fill="currentColor"></path>
    </svg>
);


const DecorativeBanner = () => (
    <div className="pointer-events-none absolute inset-0 flex rtl:-scale-x-100 rtl:flex-row-reverse" role="none">
        <div className="h-[7px] flex-1 bg-[#F2B13E] dark:bg-[#2D337D]/50" role="none"></div>
        <svg width="390" height="27" viewBox="0 0 390 27" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[27px] dark:hidden md:hidden" preserveAspectRatio="xMidYMin" meet role="none">
            <path d="M390 0H0V7H285L301 27H390V0Z" fill="url(#paint0_linear_2330_34259)" role="none"></path>
            <mask id="mask0_2330_34259" maskUnits="userSpaceOnUse" x="0" y="0" width="390" height="27" role="none" style={{ maskType: 'alpha' }}>
                <path d="M390 0H0V7H285L301 27H390V0Z" fill="url(#paint1_linear_2330_34259)" role="none"></path>
            </mask>
            <g mask="url(#mask0_2330_34259)" role="none">
                <rect x="-15.0254" y="72.4863" width="110.997" height="3" transform="rotate(-45 -15.0254 72.4863)" fill="url(#paint2_linear_2330_34259)" role="none"></rect>
                <rect opacity="0.5" x="232.053" y="58.1582" width="110.997" height="25.9753" transform="rotate(-47 232.053 58.1582)" fill="url(#paint3_linear_2330_34259)" role="none"></rect>
                <rect opacity="0.3" x="298.977" y="69.4863" width="110.997" height="6.3044" transform="rotate(-45 298.977 69.4863)" fill="url(#paint4_linear_2330_34259)" role="none"></rect>
                <path opacity="0.5" d="M192.334 72.0098L268.034 -9.16811L278.223 -7.40131L202.523 73.7766L192.334 72.0098Z" fill="url(#paint5_linear_2330_34259)" role="none"></path>
                <rect opacity="0.15" x="-21" y="123.275" width="179.995" height="4.38032" transform="rotate(-45 -21 123.275)" fill="url(#paint6_linear_2330_34259)" role="none"></rect>
            </g>
            <defs role="none">
                <linearGradient id="paint0_linear_2330_34259" x1="-9" y1="7.61906" x2="387.828" y2="41.0361" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#F2B13E" role="none"></stop><stop offset="1" stopColor="#FDD373" stopOpacity="0.63" role="none"></stop></linearGradient>
                <linearGradient id="paint1_linear_2330_34259" x1="27" y1="15.2381" x2="388.472" y2="38.7377" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#F3A00C" role="none"></stop><stop offset="1" stopColor="#FFBB21" stopOpacity="0.76" role="none"></stop></linearGradient>
                <linearGradient id="paint2_linear_2330_34259" x1="9.0067" y1="75.3242" x2="64.1695" y2="74.4301" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#DB910B" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="#F09F0B" role="none"></stop></linearGradient>
                <linearGradient id="paint3_linear_2330_34259" x1="295.701" y1="78.6918" x2="318.228" y2="69.5067" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#DE9611" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="#F79F00" role="none"></stop></linearGradient>
                <linearGradient id="paint4_linear_2330_34259" x1="323.009" y1="75.4501" x2="378.183" y2="75.0245" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#DE9611" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="#F79F00" role="none"></stop></linearGradient>
                <linearGradient id="paint5_linear_2330_34259" x1="218.794" y1="56.0898" x2="255.761" y2="15.1365" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#DE9611" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="#F79F00" role="none"></stop></linearGradient>
                <linearGradient id="paint6_linear_2330_34259" x1="17.9709" y1="127.419" x2="83.65" y2="126.721" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#F79F00" role="none"></stop><stop offset="1" stopColor="#DE9611" stopOpacity="0" role="none"></stop></linearGradient>
            </defs>
        </svg>
        <svg width="390" height="27" viewBox="0 0 390 27" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden h-[27px] dark:block dark:md:hidden" preserveAspectRatio="xMidYMin" meet role="none">
            <g opacity="0.5" role="none">
                <path d="M390 0H0V7H285L301 27H390V0Z" fill="url(#paint0_linear_5721_45163)" role="none"></path>
                <mask id="mask0_5721_45163" maskUnits="userSpaceOnUse" x="0" y="0" width="390" height="27" role="none" style={{ maskType: 'alpha' }}>
                    <path d="M390 0H0V7H285L301 27H390V0Z" fill="url(#paint1_linear_5721_45163)" role="none"></path>
                </mask>
                <g mask="url(#mask0_5721_45163)" role="none">
                    <rect opacity="0.1" x="330.975" y="69.4863" width="110.997" height="3" transform="rotate(-45 330.975 69.4863)" fill="url(#paint2_linear_5721_45163)" role="none"></rect>
                    <rect opacity="0.1" x="-15.0254" y="72.4863" width="110.997" height="3" transform="rotate(-45 -15.0254 72.4863)" fill="url(#paint3_linear_5721_45163)" role="none"></rect>
                    <rect opacity="0.1" x="232.053" y="58.1582" width="110.997" height="25.9753" transform="rotate(-47 232.053 58.1582)" fill="url(#paint4_linear_5721_45163)" role="none"></rect>
                    <path opacity="0.1" d="M192.334 72.0098L268.034 -9.16811L278.223 -7.40131L202.523 73.7766L192.334 72.0098Z" fill="url(#paint5_linear_5721_45163)" role="none"></path>
                    <rect opacity="0.15" x="-21" y="123.275" width="179.995" height="4.38032" transform="rotate(-45 -21 123.275)" fill="url(#paint6_linear_5721_45163)" role="none"></rect>
                </g>
            </g>
            <defs role="none">
                <linearGradient id="paint0_linear_5721_45163" x1="-9" y1="7.61907" x2="388.361" y2="32.8327" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#2D337D" role="none"></stop><stop offset="1" stopColor="#3C3E65" role="none"></stop></linearGradient>
                <linearGradient id="paint1_linear_5721_45163" x1="-9" y1="7.61907" x2="388.361" y2="32.8327" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#2D337D" role="none"></stop><stop offset="1" stopColor="#3C3E65" role="none"></stop></linearGradient>
                <linearGradient id="paint2_linear_5721_45163" x1="355.007" y1="72.3242" x2="410.169" y2="71.4301" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="white" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="white" role="none"></stop></linearGradient>
                <linearGradient id="paint3_linear_5721_45163" x1="9.0067" y1="75.3242" x2="64.1695" y2="74.4301" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="white" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="white" role="none"></stop></linearGradient>
                <linearGradient id="paint4_linear_5721_45163" x1="295.701" y1="78.6918" x2="318.228" y2="69.5067" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="white" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="white" role="none"></stop></linearGradient>
                <linearGradient id="paint5_linear_5721_45163" x1="218.794" y1="56.0898" x2="255.761" y2="15.1365" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="white" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="white" role="none"></stop></linearGradient>
                <linearGradient id="paint6_linear_5721_45163" x1="17.9709" y1="127.419" x2="83.65" y2="126.721" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#F79F00" role="none"></stop><stop offset="1" stopColor="#DE9611" stopOpacity="0" role="none"></stop></linearGradient>
            </defs>
        </svg>
        <svg width="1024" height="27" viewBox="0 0 1024 27" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden h-[27px] md:block dark:md:hidden" preserveAspectRatio="xMidYMin" meet role="none">
            <path d="M1024 0H0V7H516L532 27H1024V0Z" fill="url(#paint0_linear_2339_34301)" role="none"></path>
            <mask id="mask0_2339_34301" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="27" role="none" style={{ maskType: 'alpha' }}>
                <path d="M1024 0H0V7H516L532 27H1024V0Z" fill="url(#paint1_linear_2339_34301)" role="none"></path>
            </mask>
            <g mask="url(#mask0_2339_34301)" role="none">
                <rect x="215.977" y="72.4844" width="110.997" height="3" transform="rotate(-45 215.977 72.4844)" fill="url(#paint2_linear_2339_34301)" role="none"></rect>
                <rect opacity="0.5" x="463.055" y="58.1562" width="110.997" height="25.9753" transform="rotate(-47 463.055 58.1562)" fill="url(#paint3_linear_2339_34301)" role="none"></rect>
                <rect opacity="0.5" x="561.977" y="69.4844" width="110.997" height="3" transform="rotate(-45 561.977 69.4844)" fill="url(#paint4_linear_2339_34301)" role="none"></rect>
                <path opacity="0.5" d="M423.336 72.0078L499.036 -9.17006L509.225 -7.40327L433.525 73.7746L423.336 72.0078Z" fill="url(#paint5_linear_2339_34301)" role="none"></path>
                <rect opacity="0.15" x="210" y="123.273" width="179.995" height="4.38032" transform="rotate(-45 210 123.273)" fill="url(#paint6_linear_2339_34301)" role="none"></rect>
            </g>
            <defs role="none">
                <linearGradient id="paint0_linear_2339_34301" x1="222" y1="7.61902" x2="618.827" y2="41.0361" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#F2B13E" role="none"></stop><stop offset="1" stopColor="#FDD373" stopOpacity="0.63" role="none"></stop></linearGradient>
                <linearGradient id="paint1_linear_2339_34301" x1="258.001" y1="15.2381" x2="619.473" y2="38.7377" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#F3A00C" role="none"></stop><stop offset="1" stopColor="#FFBB21" stopOpacity="0.76" role="none"></stop></linearGradient>
                <linearGradient id="paint2_linear_2339_34301" x1="240.009" y1="75.3223" x2="295.171" y2="74.4282" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#DB910B" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="#F09F0B" role="none"></stop></linearGradient>
                <linearGradient id="paint3_linear_2339_34301" x1="526.703" y1="78.6898" x2="549.23" y2="69.5047" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#DE9611" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="#F79F00" role="none"></stop></linearGradient>
                <linearGradient id="paint4_linear_2339_34301" x1="586.009" y1="72.3223" x2="641.171" y2="71.4282" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#DE9611" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="#F79F00" role="none"></stop></linearGradient>
                <linearGradient id="paint5_linear_2339_34301" x1="449.796" y1="56.0878" x2="486.763" y2="15.1345" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#DE9611" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="#F79F00" role="none"></stop></linearGradient>
                <linearGradient id="paint6_linear_2339_34301" x1="248.971" y1="127.417" x2="314.65" y2="126.719" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#F79F00" role="none"></stop><stop offset="1" stopColor="#DE9611" stopOpacity="0" role="none"></stop></linearGradient>
            </defs>
        </svg>
        <svg width="1024" height="27" viewBox="0 0 1024 27" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden h-[27px] dark:md:block" preserveAspectRatio="xMidYMin" meet role="none">
            <g opacity="0.5" role="none">
                <path d="M1024 0H0V7H516L532 27H1024V0Z" fill="url(#paint0_linear_5721_48876)" role="none"></path>
                <mask id="mask0_5721_48876" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="27" role="none" style={{ maskType: 'alpha' }}>
                    <path d="M1024 0H0V7H516L532 27H1024V0Z" fill="url(#paint1_linear_5721_48876)" role="none"></path>
                </mask>
                <g mask="url(#mask0_5721_48876)" role="none">
                    <rect opacity="0.1" x="215.977" y="72.4844" width="110.997" height="3" transform="rotate(-45 215.977 72.4844)" fill="url(#paint2_linear_5721_48876)" role="none"></rect>
                    <rect opacity="0.1" x="463.055" y="58.1562" width="110.997" height="25.9753" transform="rotate(-47 463.055 58.1562)" fill="url(#paint3_linear_5721_48876)" role="none"></rect>
                    <rect opacity="0.1" x="561.977" y="69.4844" width="110.997" height="3" transform="rotate(-45 561.977 69.4844)" fill="url(#paint4_linear_5721_48876)" role="none"></rect>
                    <path opacity="0.1" d="M423.336 72.0078L499.036 -9.17006L509.225 -7.40327L433.525 73.7746L423.336 72.0078Z" fill="url(#paint5_linear_5721_48876)" role="none"></path>
                    <rect opacity="0.15" x="210" y="123.273" width="179.995" height="4.38032" transform="rotate(-45 210 123.273)" fill="url(#paint6_linear_5721_48876)" role="none"></rect>
                </g>
            </g>
            <defs role="none">
                <linearGradient id="paint0_linear_5721_48876" x1="359.075" y1="7.61896" x2="657.474" y2="21.8127" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#2D337D" role="none"></stop><stop offset="1" stopColor="#3C3E65" role="none"></stop></linearGradient>
                <linearGradient id="paint1_linear_5721_48876" x1="258.001" y1="15.2381" x2="619.473" y2="38.7377" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#F3A00C" role="none"></stop><stop offset="1" stopColor="#FFBB21" stopOpacity="0.76" role="none"></stop></linearGradient>
                <linearGradient id="paint2_linear_5721_48876" x1="240.009" y1="75.3223" x2="295.171" y2="74.4282" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="white" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="white" role="none"></stop></linearGradient>
                <linearGradient id="paint3_linear_5721_48876" x1="526.703" y1="78.6898" x2="549.23" y2="69.5047" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="white" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="white" role="none"></stop></linearGradient>
                <linearGradient id="paint4_linear_5721_48876" x1="586.009" y1="72.3223" x2="641.171" y2="71.4282" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="white" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="white" role="none"></stop></linearGradient>
                <linearGradient id="paint5_linear_5721_48876" x1="449.796" y1="56.0878" x2="486.763" y2="15.1345" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="white" stopOpacity="0" role="none"></stop><stop offset="1" stopColor="white" role="none"></stop></linearGradient>
                <linearGradient id="paint6_linear_5721_48876" x1="248.971" y1="127.417" x2="314.65" y2="126.719" gradientUnits="userSpaceOnUse" role="none"><stop stopColor="#F79F00" role="none"></stop><stop offset="1" stopColor="#DE9611" stopOpacity="0" role="none"></stop></linearGradient>
            </defs>
        </svg>
        <div className="h-[27px] flex-1 bg-[#FDD373]/[0.63] dark:bg-[#3C3E65]/50" role="none"></div>
    </div>
);

export function GameSelection() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const selectedApp = searchParams.get('app') || '100067'; // Default to Free Fire

    const handleGameClick = (appId: string) => {
        router.push(`/?app=${appId}`);
    };

    return (
        <>
            <div className="relative bg-[#EFEFEF]">
                 <div className="absolute inset-0 bg-[#EFEFEF] rtl:-scale-x-100 dark:bg-[linear-gradient(180deg,#16162B_0%,#242443_76.1%,#333356_100%)]" role="none">
                    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat dark:opacity-[0.06] md:bg-contain" role="none" style={{ backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/pattern-game-selection-59889447.png')" }}></div>
                </div>
                <DecorativeBanner />
                <div className="relative mx-auto flex max-w-5xl flex-col px-[22px] pb-[14px] pt-5 md:px-8 md:pb-4 md:pt-[27px]">
                    <h2 className="relative -ms-1.5 mb-4 text-lg/none font-bold text-gray-800 md:mb-5 md:ms-0 md:text-xl/none">
                        Seleção de jogos
                    </h2>
                    <div className="grid grid-cols-4 gap-x-[22px] gap-y-4 sm:grid-cols-6 lg:grid-cols-8">
                        {games.map(game => {
                            const isSelected = game.appId === selectedApp;
                            return (
                                <div
                                    key={game.id}
                                    className="cursor-pointer outline-none group"
                                    role="radio"
                                    aria-checked={isSelected}
                                    data-state={isSelected ? 'checked' : 'unchecked'}
                                    tabIndex={isSelected ? 0 : -1}
                                    onClick={() => handleGameClick(game.appId)}
                                    onKeyDown={(e) => {
                                        if (e.key === ' ' || e.key === 'Enter') {
                                            e.preventDefault();
                                            handleGameClick(game.appId);
                                        }
                                    }}
                                >
                                    <div className="mx-auto max-w-[70px] md:max-w-[105px]">
                                        <div className="mb-1 px-[3px] md:mb-2 md:px-2">
                                            <div className="relative">
                                                <div className={cn(
                                                    "relative overflow-hidden rounded-[25%] border-[3px] md:border-4 transition-colors",
                                                    isSelected ? "border-destructive" : "border-transparent"
                                                )}>
                                                    <div className="relative pt-[100%]">
                                                        <Image
                                                            sizes="(max-width: 768px) 70px, 105px"
                                                            className="pointer-events-none absolute inset-0 h-full w-full bg-white object-cover"
                                                            src={game.icon}
                                                            alt={game.name}
                                                            fill
                                                            data-ai-hint="game icon"
                                                        />
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "absolute inset-0 origin-top-left scale-50 rounded-ss-[50%] p-[18.75%] transition-opacity ltr:bg-[linear-gradient(-45deg,transparent_50%,#D81A0D_50%)] rtl:origin-top-right rtl:bg-[linear-gradient(45deg,transparent_50%,#D81A0D_50%)]",
                                                    isSelected ? "opacity-100" : "opacity-0"
                                                )}>
                                                    <CheckmarkIcon />
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "line-clamp-2 text-center text-xs text-gray-700 md:text-sm/[22px]",
                                            "group-data-[state=checked]:font-bold group-data-[state=checked]:text-destructive"
                                        )}>
                                            {game.name}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
