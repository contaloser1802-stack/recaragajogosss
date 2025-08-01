'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { diamondPacks, specialOffers, deltaForcePacks, deltaForceSpecialOffers } from '@/lib/data';
import { ShieldCheckIcon } from './Icons';


interface PurchaseFooterProps {
  selectedRechargeId: string | null;
  selectedPaymentId: string | null;
  onPurchase: () => void;
  gameId: string;
}

export function PurchaseFooter({ selectedRechargeId, selectedPaymentId, onPurchase, gameId }: PurchaseFooterProps) {
    if (!selectedRechargeId) {
        return null;
    }

    const isDeltaForce = gameId === '100151';
    const allItems = isDeltaForce ? [...deltaForcePacks, ...deltaForceSpecialOffers] : [...diamondPacks, ...specialOffers];
    const itemIcon = isDeltaForce 
      ? "https://cdn-gop.garenanow.com/gop/app/0000/100/151/point.png" 
      : "https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png";
    const iconAlt = isDeltaForce ? "Delta Coin" : "Diamante";
    
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
                            <Image className="h-4 w-4 object-contain" src={itemIcon} width={16} height={16} alt={iconAlt} data-ai-hint="diamond gem" />
                            <span dir="ltr">{selectedItem.originalAmount} {selectedItem.bonusAmount ? `+ ${selectedItem.bonusAmount}` : ''}</span>
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
