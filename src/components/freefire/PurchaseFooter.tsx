'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { diamondPacks, specialOffers } from '@/lib/data';

const ShieldCheckIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]">
        <path d="M54.125 34.1211C55.2966 32.9495 55.2966 31.05 54.125 29.8784C52.9534 28.7069 51.0539 28.7069 49.8823 29.8784L38.0037 41.7571L32.125 35.8784C30.9534 34.7069 29.0539 34.7069 27.8823 35.8784C26.7108 37.05 26.7108 38.9495 27.8823 40.1211L35.8823 48.1211C37.0539 49.2926 38.9534 49.2926 40.125 48.1211L54.125 34.1211Z" fill="currentColor"></path>
        <path fillRule="evenodd" clipRule="evenodd" d="M43.4187 3.4715C41.2965 2.28554 38.711 2.28554 36.5889 3.4715L8.07673 19.4055C6.19794 20.4555 4.97252 22.4636 5.02506 24.7075C5.36979 39.43 10.1986 63.724 37.0183 76.9041C38.8951 77.8264 41.1125 77.8264 42.9893 76.9041C69.809 63.724 74.6377 39.43 74.9825 24.7075C75.035 22.4636 73.8096 20.4555 71.9308 19.4055L43.4187 3.4715ZM39.5159 8.7091C39.8191 8.53968 40.1885 8.53968 40.4916 8.7091L68.9826 24.6313C68.6493 38.3453 64.2154 59.7875 40.343 71.5192C40.135 71.6214 39.8725 71.6214 39.6646 71.5192C15.7921 59.7875 11.3583 38.3453 11.025 24.6313L39.5159 8.7091Z" fill="currentColor"></path>
    </svg>
);

export function PurchaseFooter({ selectedRechargeId, selectedPaymentId, onPurchase }: { selectedRechargeId: string | null; selectedPaymentId: string | null; onPurchase: () => void; }) {
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
