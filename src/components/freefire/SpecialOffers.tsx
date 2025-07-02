import { Button } from "@/components/ui/button";
import { CalendarDays, Star, Award } from 'lucide-react';

const offers = [
  { name: "Assinatura Semanal", icon: <CalendarDays className="h-8 w-8 text-white"/>, bgColor: "bg-gradient-to-br from-red-500 to-red-700", price: "R$ 7,90" },
  { name: "Assinatura Mensal", icon: <CalendarDays className="h-8 w-8 text-white"/>, bgColor: "bg-gradient-to-br from-orange-400 to-orange-600", price: "R$ 32,90" },
  { name: "Passe Booyah", icon: <Award className="h-8 w-8 text-white"/>, bgColor: "bg-gradient-to-br from-purple-500 to-purple-700", price: "R$ 35,00" },
  { name: "Oferta Especial", icon: <Star className="h-8 w-8 text-white"/>, bgColor: "bg-gradient-to-br from-yellow-400 to-yellow-600", price: "R$ 4,90" },
];

export function SpecialOffers() {
  return (
    <section className="mb-12 bg-white py-12">
       <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Ofertas Especiais</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {offers.map((offer, index) => (
             <div key={index} className={`rounded-lg p-6 text-center text-white flex flex-col items-center justify-between shadow-lg transition-all hover:scale-105 hover:shadow-2xl ${offer.bgColor}`}>
                <div className="flex-shrink-0">{offer.icon}</div>
                <p className="font-bold text-lg my-4 flex-1">{offer.name}</p>
                <Button className="w-full bg-white text-black hover:bg-gray-200 rounded-lg">{offer.price}</Button>
             </div>
          ))}
        </div>
       </div>
    </section>
  );
}
