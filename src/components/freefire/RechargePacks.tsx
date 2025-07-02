import { Button } from "@/components/ui/button";
import { Gem } from "lucide-react";

const diamondPacks = [
  { diamonds: 65, price: "R$ 3,00" },
  { diamonds: 100, price: "R$ 5,00" },
  { diamonds: 310, price: "R$ 15,00" },
  { diamonds: 520, price: "R$ 25,00" },
  { diamonds: 1060, price: "R$ 50,00" },
  { diamonds: 2180, price: "R$ 100,00" },
];

export function RechargePacks() {
  return (
    <section className="mb-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Valor de Recarga</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {diamondPacks.map((pack, index) => (
            <div 
              key={index}
              className={`rounded-lg p-4 text-center border relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl ${index === 0 ? 'bg-gradient-to-b from-[#00BFFF] to-white border-blue-400' : 'bg-gradient-to-b from-gray-200 to-white border-gray-300'}`}
            >
              <div className="absolute top-2 left-2">
                 <Gem className="h-6 w-6 text-white opacity-75" />
              </div>
              <div className="mt-8 mb-4 min-h-[6rem] flex flex-col justify-center">
                <p className="text-xl font-bold">{pack.diamonds}</p>
                <p className="text-lg font-extrabold text-slate-800">Diamantes</p>
              </div>
              <Button className="w-full bg-[#FF4C00] text-white hover:bg-red-700 rounded-lg">{pack.price}</Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
