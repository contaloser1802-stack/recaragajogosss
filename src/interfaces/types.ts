// Interface para o payload da sua API create-payment (GhostPay)
export interface PaymentPayload {
  name: string;
  email: string;
  cpf?: string; // CPF é opcional, pois pode ser gerado no backend
  phone: string;
  paymentMethod: 'PIX';
  amount: number; // Alterado para number em vez de string
  traceable: boolean;
  externalId: string;
  items: {
    id: string; 
    unitPrice: number; // Alterado para number
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
  price: number; 
  formattedPrice: string;
  image?: string; 
}
