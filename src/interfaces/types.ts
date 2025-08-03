// Interface para o payload da sua API create-payment (BuckPay)
export interface PaymentPayload {
  name: string;
  email: string;
  cpf?: string; 
  phone: string;
  amount: number;
  externalId: string;
  items: {
    id: string; 
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
  price: number; 
  formattedPrice: string;
  image?: string;
  promo?: string; 
}
