
'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/freefire/Header';
import { Footer } from '@/components/freefire/Footer';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

const cpfSchema = z.string().refine(value => {
    if (typeof value !== 'string') return false;
    const cpf = value.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    return true;
}, "CPF inválido.");


const formSchema = z.object({
  name: z.string()
    .min(1, { message: "Nome é obrigatório." })
    .refine(value => value.trim().split(" ").length >= 2, {
      message: "Por favor, insira o nome e sobrenome.",
    }),
  email: z.string()
    .min(1, { message: "E-mail é obrigatório." })
    .email({ message: "Formato de e-mail inválido." }),
  cpf: cpfSchema,
  phone: z.string()
    .min(1, { message: "Número de telefone é obrigatório." })
    .regex(/^\(\d{2}\) \d \d{4}-\d{4}$/, { message: "Formato de telefone inválido." }),
  promoCode: z.string().optional(),
});


interface ProductData {
    id: string;
    name: string;
    originalAmount: string;
    bonusAmount: string;
    totalAmount: string;
    price: string;
    formattedPrice: string;
}

interface PaymentPayload {
    customer: {
        name: string;
        email: string;
        document: string;
        mobile_phone: string;
    },
    payment: {
        payment_method: string;
        amount: number;
    },
    items: {
        description: string;
        amount: number;
        quantity: number;
    }[];
}

const specialOfferItems = [
    { id: 'calca-angelical', name: 'Calça Angelical Azul', price: 19.99, originalPrice: 99.99, image: 'https://i.ibb.co/20xnTqXn/calca-angelical-free-fire-1-1-1.png' },
    { id: 'dima-bonus', name: '9999 Diamantes Bônus', price: 19.99, originalPrice: 99.99, image: 'https://i.ibb.co/zTHMnnGZ/Screenshot-25.png' },
    { id: 'dunk-master', name: 'Dunk Master', price: 19.99, originalPrice: 99.99, image: 'https://i.ibb.co/hFbybXQs/maxresdefault-1-910x512-1.jpg' },
    { id: 'barba-velho', name: 'Barba do Velho', price: 19.99, originalPrice: 99.99, image: 'https://i.ibb.co/C5zTtbx7/barbinha-ff-1-1.jpg' },
    { id: 'sombra-roxa', name: 'Sombra Roxa', price: 19.99, originalPrice: 99.99, image: 'https://i.ibb.co/DDYCDq6Z/uni20pinea0dfd15-5b98-4a3f-96de-f77eccea8f06-1-1-1.png' },
];


function CheckoutForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [product, setProduct] = useState<ProductData | null>(null);
  const [playerName, setPlayerName] = useState("Carregando...");
  const [paymentMethodName, setPaymentMethodName] = useState("PagSeguro");
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);


    useEffect(() => {
        try {
            const storedProduct = localStorage.getItem('selectedProduct');
            const storedPlayerName = localStorage.getItem('playerName');
            const storedPaymentMethod = localStorage.getItem('paymentMethodName');

            if (storedProduct) {
                setProduct(JSON.parse(storedProduct));
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Nenhum produto selecionado. Você será redirecionado.",
                });
                setTimeout(() => router.push('/'), 2000);
            }
            
            if (storedPlayerName) {
                setPlayerName(storedPlayerName);
            }

            if(storedPaymentMethod) {
                setPaymentMethodName(storedPaymentMethod);
            }

        } catch (error) {
            console.error("Failed to access localStorage or parse data", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.",
            });
            router.push('/');
        }
    }, [router, toast]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      cpf: '',
      phone: '',
      promoCode: '',
    },
  });

  const handleOfferChange = (offerId: string) => {
    setSelectedOffers(prev =>
      prev.includes(offerId) ? prev.filter(id => id !== offerId) : [...prev, offerId]
    );
  };

  const calculateTotal = () => {
    const mainProductPrice = product ? parseFloat(product.price) : 0;
    
    let totalOffersPrice = 0;
    selectedOffers.forEach(offerId => {
      const offer = specialOfferItems.find(o => o.id === offerId);
      if(offer) {
        totalOffersPrice += offer.price;
      }
    });

    return (mainProductPrice + totalOffersPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };


  const promoCodeValue = form.watch("promoCode");

  const handleApplyPromoCode = () => {
    if (promoCodeValue === 'DIAMANTE100') {
      setIsPromoApplied(true);
      toast({
        title: "Sucesso!",
        description: "Código promocional aplicado.",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Código promocional inválido.",
      })
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: string) => void) => {
    const { value } = e.target;
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${'${cleaned.slice(0,3)}'}.${'${cleaned.slice(3)}'}`;
    }
    if (cleaned.length > 5) {
      formatted = `${'${cleaned.slice(0,3)}'}.${'${cleaned.slice(3,6)}'}.${'${cleaned.slice(6)}'}`;
    }
     if (cleaned.length > 8) {
      formatted = `${'${cleaned.slice(0,3)}'}.${'${cleaned.slice(3,6)}'}.${'${cleaned.slice(6,9)}'}-${'${cleaned.slice(9)}'}`;
    }
    fieldChange(formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: string) => void) => {
    const { value } = e.target;
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    let formatted = cleaned;
    if (cleaned.length > 0) {
      formatted = `(${'${cleaned.slice(0, 2)}'}`;
    }
    if (cleaned.length >= 3) {
      formatted = `(${'${cleaned.slice(0, 2)}'}) ${'${cleaned.slice(2, 3)}'}`;
    }
    if (cleaned.length >= 4) {
      formatted = `(${'${cleaned.slice(0, 2)}'}) ${'${cleaned.slice(2, 3)}'} ${'${cleaned.slice(3, 7)}'}`;
    }
    if (cleaned.length >= 8) {
      formatted = `(${'${cleaned.slice(0, 2)}'}) ${'${cleaned.slice(2, 3)}'} ${'${cleaned.slice(3, 7)}'}-${'${cleaned.slice(7, 11)}'}`;
    }
    fieldChange(formatted);
  };
  
  const proceedToPayment = async () => {
    await form.trigger();
    if (form.formState.isValid) {
      setIsModalOpen(true);
    } else {
       toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha todos os campos corretamente.",
      });
    }
  }

  const handleFinalSubmit = async () => {
     if (!product) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Produto não encontrado. Tente novamente.",
        });
        return;
    }
    
    setIsSubmitting(true);
    const values = form.getValues();
    
    let finalAmount = parseFloat(product.price);
    const items = [{
        description: product.name,
        amount: finalAmount * 100,
        quantity: 1,
    }];

    selectedOffers.forEach(offerId => {
        const offer = specialOfferItems.find(o => o.id === offerId);
        if (offer) {
            finalAmount += offer.price;
            items.push({
                description: offer.name,
                amount: offer.price * 100,
                quantity: 1
            });
        }
    });

    const payload: PaymentPayload = {
      customer: {
        name: values.name,
        email: values.email,
        document: values.cpf.replace(/\D/g, ''),
        mobile_phone: values.phone.replace(/\D/g, ''),
      },
      payment: {
        payment_method: 'pix',
        amount: Math.round(finalAmount * 100), // Amount in cents
      },
      items: items.map(item => ({...item, amount: Math.round(item.amount)}))
    };

    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.response?.errors?.customer?.document || data.error || "Erro ao processar o pagamento";
        throw new Error(errorMessage);
      }

      localStorage.setItem('paymentData', JSON.stringify({
        ...data,
        playerName: playerName,
        productDescription: product.name,
        amount: finalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        diamonds: product.totalAmount,
      }));

      if (data.qr_code_url || data.qr_code_text) {
        router.push('/buy');
      } else {
        throw new Error("Resposta de pagamento inválida");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no pagamento", description: error.message });
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
    }
  };


  if (!product) {
        return (
            <div className="flex flex-col md:mx-auto md:my-6 md:max-w-[600px] md:rounded-2xl md:bg-white overflow-hidden items-center justify-center p-10">
                <p>Carregando produto...</p>
            </div>
        );
    }


  return (
    <div className="flex flex-col md:mx-auto md:my-6 md:max-w-[600px] md:rounded-2xl md:bg-white overflow-hidden">
      <div className="mb-3 bg-gray-50 md:mb-4 md:rounded-t-2xl md:p-2 md:pb-0">
        <div className="relative h-20 overflow-hidden md:h-[120px] md:rounded-t-lg">
          <Image
            className="h-full w-full object-cover"
            src="https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-f997537d.jpg"
            alt="Free Fire Banner"
            fill
            data-ai-hint="gameplay screenshot"
          />
          <Link
            href="/"
            className="absolute start-4 top-4 md:start-6 md:top-6 flex items-center gap-1.5 rounded-full bg-black/40 p-1.5 pr-3 text-sm/none font-medium text-white ring-1 ring-white/70 transition-colors hover:bg-black/60 md:pr-3.5 md:text-base/none"
            aria-label="Voltar para a pagina inicial"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            Voltar
          </Link>
        </div>
        <div className="relative mx-5 -mt-9 flex flex-col items-center gap-4 md:-mt-10">
          <Image
            className="block h-[72px] w-[72px] overflow-hidden rounded-lg bg-white object-contain ring-4 ring-gray-50 md:h-20 md:w-20"
            src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/icon.png"
            alt="Free Fire"
            width={80}
            height={80}
            data-ai-hint="game icon"
          />
          <div className="text-center text-xl/none font-bold text-gray-800 md:text-2xl/none">Free Fire</div>
        </div>
      </div>

      <dl className="mb-3 grid grid-cols-2 justify-between gap-x-3.5 px-4 md:mb-4 md:px-10">
        <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Total</dt>
        <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">
          <Image className="h-3.5 w-3.5" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={14} height={14} alt="Diamante" data-ai-hint="diamond gem" />
          {product.totalAmount}
        </dd>

        <div className="col-span-2 my-1 w-full">
          <ul className="flex flex-col gap-3 rounded-md border border-gray-200/50 bg-white p-3 text-xs/none md:text-sm/none">
            <li className="flex items-center justify-between gap-12">
              <div className="text-gray-600">Preço Original</div>
              <div className="flex shrink-0 items-center gap-1">
                <Image className="h-3 w-3 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={12} height={12} alt="Diamante" data-ai-hint="diamond gem" />
                <div className="font-medium text-gray-800">{product.originalAmount}</div>
              </div>
            </li>
            <li className="flex items-center justify-between gap-12">
              <div className="text-gray-600">+ Bônus Geral</div>
              <div className="flex shrink-0 items-center gap-1">
                <Image className="h-3 w-3 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={12} height={12} alt="Diamante" data-ai-hint="diamond gem" />
                <div className="font-medium text-gray-800">{product.bonusAmount}</div>
              </div>
            </li>
          </ul>
        </div>

        <div className="col-span-2 mb-1 text-xs/normal text-gray-500 md:text-sm/normal">
          Os diamantes, são válidos apenas para a região do Brasil e serão creditados diretamente na conta de jogo.
        </div>

        <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Preço</dt>
        <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">
          {product.formattedPrice}
        </dd>

        <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Método de pagamento</dt>
        <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">{paymentMethodName}</dd>

        <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Nome do Jogador</dt>
        <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">{playerName}</dd>
      </dl>

      <div className="h-2 bg-gray-200"></div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(proceedToPayment)} className="flex flex-col gap-6 px-4 pb-8 pt-5 md:p-10 md:pt-6">
          <FormField
            control={form.control}
            name="promoCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[15px]/4 font-medium text-gray-800">Código promocional</FormLabel>
                <div className="flex items-end">
                  <FormControl>
                    <Input {...field} placeholder="Código Promocional" className="flex-1 rounded-r-none border-r-0 focus-visible:ring-offset-0" disabled={isPromoApplied} />
                  </FormControl>
                  <Button type="button" className="rounded-l-none h-11 px-5 text-base" variant="destructive" disabled={promoCodeValue !== 'DIAMANTE100' || isPromoApplied} onClick={handleApplyPromoCode}>
                    {isPromoApplied ? "Aplicado" : "Aplicar"}
                  </Button>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[15px]/4 font-medium text-gray-800">Nome Completo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome Completo" maxLength={50} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[15px]/4 font-medium text-gray-800">E-mail</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="E-mail" maxLength={60} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[15px]/4 font-medium text-gray-800">CPF</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    onChange={(e) => handleCpfChange(e, field.onChange)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[15px]/4 font-medium text-gray-800">Número de telefone</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    inputMode="numeric"
                    placeholder="(00) 0 0000-0000"
                    onChange={(e) => handlePhoneChange(e, field.onChange)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-gray-500 text-xs/normal">
            Ao clicar em “Prosseguir para Pagamento”, atesto que li e concordo com os <a href="https://international.pagseguro.com/legal-compliance" className="underline" target="_blank" rel="noopener noreferrer">termos de uso</a> e com a <a href="https://sobreuol.noticias.uol.com.br/normas-de-seguranca-e-privacidade/" className="underline" target="_blank" rel="noopener noreferrer">política de privacidade</a> do PagSeguro
          </div>

          <div className="mt-2">
            <Button type="button" onClick={proceedToPayment} className="w-full h-11 text-base" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? "Processando..." : "Prosseguir para pagamento"}
            </Button>
          </div>
        </form>
      </Form>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-center text-xl">Promoção Especial</DialogTitle>
          </DialogHeader>
          <div className="p-6 py-0 space-y-4">
            {specialOfferItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                    <Image src={item.image} alt={item.name} width={200} height={200} className="w-full h-full object-cover" data-ai-hint="game item icon"/>
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      <span className="line-through">R$ {item.originalPrice.toFixed(2).replace('.',',')}</span>
                      <span className="text-destructive font-bold ml-2">R$ {item.price.toFixed(2).replace('.',',')}</span>
                    </p>
                  </div>
                </div>
                <Checkbox
                    checked={selectedOffers.includes(item.id)}
                    onCheckedChange={() => handleOfferChange(item.id)}
                 />
              </div>
            ))}
          </div>
           <div className="p-6 pt-4 flex flex-col gap-4">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span>{calculateTotal()}</span>
            </div>
            {selectedOffers.length > 0 && (
                <Button onClick={handleFinalSubmit} disabled={isSubmitting} variant="destructive" className="w-full h-12 text-lg">
                    {isSubmitting ? "Finalizando..." : "Finalizar Pedido"}
                </Button>
            )}
            {selectedOffers.length === 0 && (
                 <Button onClick={handleFinalSubmit} disabled={isSubmitting} variant="destructive" className="w-full h-12 text-lg">
                    Recusar promoção
                </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-06d91604.png')" }}>
        <Suspense fallback={<div className="flex items-center justify-center h-full">Carregando...</div>}>
          <CheckoutForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
