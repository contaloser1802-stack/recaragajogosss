// Interface para o payload da sua API create-payment (GhostPay)
export interface PaymentPayload {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  paymentMethod: 'PIX';
  amount: number;
  traceable: boolean;
  externalId: string;
  postbackUrl: string;
  items: {
    id: string; // Adicionado id do produto
    unitPrice: number;
    title: string;
    quantity: number;
    tangible: boolean;
  }[];
  utmQuery?: string;
  cep?: string;
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

export interface ProductData {
  id: string;
  name: string;
  originalAmount: string;
  bonusAmount: string;
  totalAmount: string;
  price: string;
  formattedPrice: string;
  image?: string; // Adicionado para ofertas especiais
}
