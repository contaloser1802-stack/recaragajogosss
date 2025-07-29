// Interface para o payload da sua API create-payment (GhostPay)
export interface PaymentPayload {
  name: string;
  email: string;
  cpf?: string; // CPF é opcional, pois pode ser gerado no backend
  phone: string;
  paymentMethod: 'PIX';
  amount: number;
  traceable: boolean;
  externalId: string;
  items: {
    id: string; // Adicionado id do produto
    unitPrice: number;
    title: string;
    quantity: number;
    tangible: boolean;
  }[];
  utmQuery?: string;
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
