import { CreditCard, Landmark, Barcode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PixIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-800">
      <path d="M12.0001 6.89248C11.5369 6.89248 11.122 6.64333 10.9593 6.2238C10.6924 5.53982 9.92097 5.25367 9.237 5.52055C8.55303 5.78744 8.26688 6.55886 8.53376 7.24284L11.0026 13.1119C11.1065 13.3644 11.2829 13.5786 11.5123 13.7289C11.7416 13.8792 12.0137 13.9593 12.2908 13.9602L15.253 13.958C15.7196 13.9571 16.143 13.7143 16.3113 13.2985C16.5746 12.6174 16.2795 11.8488 15.5984 11.5855C14.9173 11.3222 14.1487 11.6173 13.8854 12.2985L12.0001 16.7118L10.1169 12.2985" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.7469 10.0418L11.4877 1.88818C11.2208 1.20421 10.4494 0.918059 9.76544 1.18494C9.08147 1.45183 8.79531 2.22325 9.06219 2.90722L12 10.0418" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.4998 17.25C17.4998 17.9404 16.9401 18.5 16.2498 18.5C15.5594 18.5 14.9998 17.9404 14.9998 17.25C14.9998 16.5596 15.5594 16 16.2498 16C16.9401 16 17.4998 16.5596 17.4998 17.25Z" fill="currentColor"/>
      <path d="M2.75 12C2.75 17.108 6.89196 21.25 12 21.25C17.108 21.25 21.25 17.108 21.25 12C21.25 6.89196 17.108 2.75 12 2.75C9.25999 2.75 6.78002 3.84502 4.99002 5.63502" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


const paymentMethods = [
  { name: "PIX", icon: <PixIcon /> },
  { name: "Visa", icon: <CreditCard className="h-10 w-10 text-gray-800" /> },
  { name: "MasterCard", icon: <CreditCard className="h-10 w-10 text-gray-800" /> },
  { name: "Boleto", icon: <Barcode className="h-10 w-10 text-gray-800" /> },
  { name: "Transferência", icon: <Landmark className="h-10 w-10 text-gray-800" /> },
];

export function PaymentMethods() {
  return (
    <section className="bg-[#EFEFEF] py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Métodos de Pagamento</h2>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
          {paymentMethods.map((method, index) => (
            <div key={index} className="flex flex-col items-center gap-2 group">
               <div className="relative">
                 <button className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all group-hover:scale-110">
                    {method.icon}
                 </button>
                 <Badge className="absolute -top-1 -right-2 bg-[#FF4C00] text-white border-2 border-white">PROMO</Badge>
               </div>
               <p className="font-semibold text-sm">{method.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
