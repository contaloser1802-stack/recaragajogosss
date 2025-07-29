import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

export function LoginSection() {
  return (
    <section className="pb-12 md:pb-20 bg-[#EFEFEF]">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Free Fire</h2>
          <p className="font-semibold text-base text-gray-600 flex items-center justify-center gap-2 my-4">
            <ShieldCheck className="h-5 w-5 text-green-500"/>
            <span>Pagamento 100% Seguro</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Input
              type="text"
              placeholder="ID do jogador"
              className="flex-grow border-gray-300 focus:ring-red-500 focus:border-red-500 rounded-lg"
            />
            <Button className="bg-[#FF4C00] text-white hover:bg-red-700 w-full sm:w-auto rounded-lg">
              Login
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

    