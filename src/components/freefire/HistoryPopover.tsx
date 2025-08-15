'use client';

import React from 'react';
import Image from 'next/image';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PopoverContent } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { DialogTitle } from '@radix-ui/react-dialog';

type LoginHistoryItem = {
    id: string;
    name: string;
};

interface HistoryPopoverContentProps {
    history: LoginHistoryItem[];
    onClose: () => void;
    onSelect: (id: string) => void;
    onRemove: (id: string) => void;
}

const HistoryPopoverContent: React.FC<HistoryPopoverContentProps> = ({ history, onClose, onSelect, onRemove }) => {
    const isMobile = useIsMobile();

    const content = (
        <>
            {isMobile ? (
                <SheetHeader className="relative p-4 border-b text-center">
                     <button
                        onClick={onClose}
                        className="absolute inset-y-0 start-4 my-auto h-fit text-2xl text-gray-500 transition-opacity hover:opacity-70"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <SheetTitle>Select Player ID</SheetTitle>
                    <SheetDescription className="sr-only">
                        Select a saved account from your history or remove items.
                    </SheetDescription>
                </SheetHeader>
            ) : (
                <div className="p-4 border-b text-center">
                    <h3 className="text-lg/none font-medium text-gray-800">Select Player ID</h3>
                </div>
            )}
            <ul className="md:p-1">
                {history.map(item => (
                    <li key={item.id} className="flex items-center py-3 max-md:mx-4 max-md:border-b md:px-4">
                        <div
                            className="flex-1 flex items-center cursor-pointer"
                            onClick={() => onSelect(item.id)}
                        >
                            <div className="me-3 h-10 w-10 shrink-0 overflow-hidden rounded-full">
                                <Image className="block h-full w-full object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png" width={40} height={40} alt="Free Fire Icon" data-ai-hint="game icon" />
                            </div>
                            <div className="flex-1">
                                <div className="mb-2 text-base/none font-medium">{item.name}</div>
                                <div className="text-xs/none text-gray-500">ID do jogador: {item.id}</div>
                            </div>
                        </div>
                        <Button onClick={() => onRemove(item.id)} variant="ghost" size="icon" className="ms-4 text-gray-400 hover:text-destructive active:opacity-60" aria-label={`Remover ${item.name} do histórico`}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </li>
                ))}
            </ul>
        </>
    );

    if (isMobile) {
        return (
            <SheetContent side="bottom" className="p-0 gap-0 rounded-t-lg">
                {content}
            </SheetContent>
        );
    }

    return (
        <PopoverContent className="p-0" side="bottom" align="start" style={{ width: 'var(--radix-popover-anchor-width)' }}>
            {content}
        </PopoverContent>
    );
};


export function HistoryPopover(props: HistoryPopoverContentProps) {
    return <HistoryPopoverContent {...props} />;
}
