'use client';

import { Suspense, useState, useEffect, useMemo, useRef } from 'react'; // Adicionado useRef
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

// --- Funções de Geração de CPF REAL (e válido) ---
function gerarDigitoVerificador(cpfParcial: string) {
  let soma = 0;
  let peso = cpfParcial.length + 1;

  for (let i = 0; i < cpfParcial.length; i++) {
    soma += parseInt(cpfParcial.charAt(i)) * peso;
    peso--;
  }

  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function formatarCPF(cpf: string) {
  // Garante que o CPF tem 11 dígitos antes de formatar
  if (cpf.length !== 11) return cpf;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function gerarCPFValido(): string {
  let cpfNumeros = '';
  // Gera os primeiros 9 dígitos aleatoriamente
  for (let i = 0; i < 9; i++) {
    cpfNumeros += Math.floor(Math.random() * 10);
  }

  // Calcula o primeiro dígito verificador
  const digito1 = gerarDigitoVerificador(cpfNumeros);
  cpfNumeros += digito1;

  // Calcula o segundo dígito verificador
  const digito2 = gerarDigitoVerificador(cpfNumeros);
  cpfNumeros += digito2;

  return formatarCPF(cpfNumeros);
}
// --- Fim das Funções de Geração de CPF REAL ---


// Esquema de validação do formulário - CPF removido para não ser preenchido pelo usuário
const formSchema = z.object({
  name: z.string()
    .min(1, { message: "Nome é obrigatório." })
    .refine(value => value.trim().split(" ").length >= 2, {
      message: "Por favor, insira o nome e sobrenome.",
    }),
  email: z.string()
    .min(1, { message: "E-mail é obrigatório." })
    .email({ message: "Formato de e-mail inválido." }),
  phone: z.string()
    .min(1, { message: "Número de telefone é obrigatório." })
    .regex(/^\(\d{2}\) \d \d{4}-\d{4}$/, { message: "Formato de telefone inválido." }),
  promoCode: z.string().optional(),
});


// Interface para o payload da sua API create-payment (GhostPay)
interface PaymentPayload {
  name: string;
  email: string;
  cpf: string; // CPF agora é enviado, mas gerado automaticamente
  phone: string;
  paymentMethod: 'PIX'; // Hardcoded para PIX
  amount: number;
  traceable: boolean;
  externalId: string;
  postbackUrl: string;
  items: {
    unitPrice: number;
    title: string;
    quantity: number;
    tangible: boolean;
  }[];
  utmQuery?: string; // utmQuery é opcional
  cep?: string; // Adicionado do seu create-payment anterior
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  checkoutUrl?: string;
  referrerUrl?: string;
  fingerPrints?: { provider: string; value: string; }[];
}

interface ProductData {
  id: string;
  name: string;
  originalAmount: string; // Estes valores são strings para exibição
  bonusAmount: string;
  totalAmount: string; // total de diamantes ou pontos
  price: string; // Preço do item principal em BRL (string para exibição)
  formattedPrice: string; // Preço formatado para exibição
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
  const [paymentMethodName, setPaymentMethodName] = useState("PIX"); // Definido como PIX agora
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);

  // Usar useRef para manter um Set de CPFs gerados na sessão
  const generatedCpfs = useRef(new Set<string>());

  // Carrega os dados do produto, nome do jogador, etc.
  useEffect(() => {
    // CÓDIGO DO PIXEL (mantido, pois é um script externo)
    window.pixelId = "68652c2603b34a13ee47f2dd";
    const utmScript = document.createElement("script");
    utmScript.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
    utmScript.async = true;
    utmScript.defer = true;
    document.head.appendChild(utmScript);

    const latestScript = document.createElement("script");
    latestScript.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
    latestScript.async = true;
    latestScript.defer = true;
    latestScript.setAttribute("data-utmify-prevent-xcod-sck", "");
    latestScript.setAttribute("data-utmify-prevent-subids", "");
    document.head.appendChild(latestScript);

    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    window.fbq("init", "1264486768354584");
    window.fbq("track", "PageView");
    // FIM CÓDIGO DO PIXEL

    try {
      const storedProduct = localStorage.getItem('selectedProduct');
      const storedPlayerName = localStorage.getItem('playerName');

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
      } else {
        setPlayerName("Não encontrado"); // Fallback caso não encontre
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
      phone: '',
      promoCode: '',
    },
  });

  const handleOfferChange = (offerId: string) => {
    setSelectedOffers(prev =>
      prev.includes(offerId) ? prev.filter(id => id !== offerId) : [...prev, offerId]
    );
  };

  // Calcula o total dinamicamente
  const calculateTotal = useMemo(() => {
    if (!product) return 'R$ 0,00';

    let mainProductPrice = parseFloat(product.price);
    if (isNaN(mainProductPrice)) mainProductPrice = 0; // Garante que é um número

    let totalOffersPrice = 0;
    selectedOffers.forEach(offerId => {
      const offer = specialOfferItems.find(o => o.id === offerId);
      if (offer) {
        totalOffersPrice += offer.price;
      }
    });
    return (mainProductPrice + totalOffersPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, [product, selectedOffers]);

  // Calcula o valor total numérico para o payload
  const getNumericTotalAmount = useMemo(() => {
    if (!product) return 0;
    let mainProductPrice = parseFloat(product.price);
    if (isNaN(mainProductPrice)) mainProductPrice = 0;

    let totalOffersPrice = 0;
    selectedOffers.forEach(offerId => {
      const offer = specialOfferItems.find(o => o.id === offerId);
      if (offer) {
        totalOffersPrice += offer.price;
      }
    });
    return mainProductPrice + totalOffersPrice;
  }, [product, selectedOffers]);


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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: string) => void) => {
    const { value } = e.target;
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    let formatted = cleaned;
    if (cleaned.length > 0) {
      formatted = `(${cleaned.slice(0, 2)}`;
    }
    if (cleaned.length >= 3) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)}`;
    }
    if (cleaned.length >= 4) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}`;
    }
    if (cleaned.length >= 8) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
    fieldChange(formatted);
  };

  const proceedToPayment = async () => {
    // Dispara a validação do formulário para nome, email, telefone
    const isValid = await form.trigger(['name', 'email', 'phone']);
    if (isValid) {
      setIsModalOpen(true);
    } else {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios corretamente.",
      });
    }
  };

  // Função que será chamada ao clicar em "Finalizar Pedido" no modal
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

    // Gera um CPF válido e garante que não se repita na sessão atual
    let generatedCpfClean: string;
    do {
      generatedCpfClean = gerarCPFValido().replace(/\D/g, ''); // Gera e limpa o CPF
    } while (generatedCpfs.current.has(generatedCpfClean)); // Verifica se já foi gerado
    
    generatedCpfs.current.add(generatedCpfClean); // Adiciona ao Set de CPFs gerados

    const utmQuery = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).toString() : '';

    const payloadItems = [{
      unitPrice: parseFloat(product.price),
      title: product.name,
      quantity: 1,
      tangible: false,
    }];

    selectedOffers.forEach(offerId => {
      const offer = specialOfferItems.find(o => o.id === offerId);
      if (offer) {
        payloadItems.push({
          unitPrice: offer.price,
          title: offer.name,
          quantity: 1,
          tangible: false
        });
      }
    });

    // Construir a URL base dinamicamente para o postback
    const currentBaseUrl = window.location.origin;

    const payload: PaymentPayload = {
      name: values.name,
      email: values.email,
      cpf: generatedCpfClean, // CPF gerado automaticamente e enviado
      phone: values.phone.replace(/\D/g, ''),
      paymentMethod: "PIX",
      amount: getNumericTotalAmount, // Valor numérico total
      traceable: true,
      externalId: `ff-${Date.now()}`,
      postbackUrl: `${currentBaseUrl}/api/ghostpay-webhook`,
      items: payloadItems,
      utmQuery,
      // Dados de endereço e fingerprint conforme seu create-payment anterior, se necessário
      cep: '01001-000',
      street: 'ruabruxo',
      number: '777',
      complement: 'Apto 101',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      checkoutUrl: `${currentBaseUrl}/checkout`,
      referrerUrl: currentBaseUrl,
      fingerPrints: [{ provider: 'browser', value: 'unico-abc-123' }] // Fingerprint de exemplo
    };

    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Se não for JSON, leia como texto para depuração
        const textData = await response.text();
        console.error("Resposta não-JSON da API de pagamento:", textData);
        throw new Error(`Ocorreu um erro no servidor. Tente novamente mais tarde. (Status: ${response.status})`);
      }

      if (!response.ok) {
        const errorMessage = data.message || data.error || "Erro ao processar o pagamento";
        throw new Error(errorMessage);
      }

      localStorage.setItem('paymentData', JSON.stringify({
        ...data,
        playerName: playerName,
        productDescription: product.name,
        amount: calculateTotal,
        diamonds: product.totalAmount,
        originalAmount: product.originalAmount,
        bonusAmount: product.bonusAmount,
        totalAmount: product.totalAmount,
        selectedOffers: selectedOffers.map(id => specialOfferItems.find(o => o.id === id)?.name).filter(Boolean),
      }));

      if (data.pixQrCode || data.pixCode) {
        router.push('/buy');
      } else if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error("Pagamento retornou sem dados válidos para Pix ou redirecionamento.");
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
        <form onSubmit={(e) => { e.preventDefault(); proceedToPayment(); }} className="flex flex-col gap-6 px-4 pb-8 pt-5 md:p-10 md:pt-6">
          <FormField
            control={form.control}
            name="promoCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[15px]/4 font-medium text-gray-800">Código promocional</FormLabel>
                <div className="flex items-end">
                  <FormControl>
                    <Input {...field} placeholder="Código Promocional" className="flex-1 rounded-r-none border-r-0" disabled={isPromoApplied} />
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
            <Button type="submit" className="w-full h-11 text-base" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? "Processando..." : "Prosseguir para pagamento"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Modal de Promoção Especial */}
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
                    <Image src={item.image} alt={item.name} width={200} height={200} className="w-full h-full object-cover" data-ai-hint="game item icon" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      <span className="line-through">R$ {item.originalPrice.toFixed(2).replace('.', ',')}</span>
                      <span className="text-destructive font-bold ml-2">R$ {item.price.toFixed(2).replace('.', ',')}</span>
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
              <span>{calculateTotal}</span>
            </div>
            {selectedOffers.length > 0 ? (
                <Button onClick={handleFinalSubmit} disabled={isSubmitting} variant="destructive" className="w-full h-12 text-lg">
                    {isSubmitting ? "Finalizando..." : "Finalizar Pedido"}
                </Button>
            ) : (
                <Button onClick={handleFinalSubmit} disabled={isSubmitting} variant="destructive" className="w-full h-12 text-lg">
                    {isSubmitting ? "Finalizando..." : "Recusar promoção"}
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
