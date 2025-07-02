import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, cpf, phone, amount, externalId, postbackUrl, items } = body;

    if (!name || !email || !cpf || !phone || !amount || !externalId || !items) {
      return NextResponse.json(
        { error: 'Dados insuficientes ou inválidos para criar o pagamento.' },
        { status: 400 }
      );
    }

    const secretKey = process.env.GHOSTPAY_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Chave da API Ghostpay ausente.' },
        { status: 500 }
      );
    }

    const payload = {
      name, email, cpf, phone,
      paymentMethod: 'PIX',
      amount,
      traceable: true,
      externalId,
      postbackUrl,
      items,
      cep: '01001-000',
      street: 'ruabruxo',
      number: '777',
      complement: 'Apto 101',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      checkoutUrl: 'https://sopayload.com/checkout',
      referrerUrl: 'https://sopayload.com',
      utmQuery: 'utm_source=checkout&utm_campaign=freefire',
      fingerPrints: [{ provider: 'browser', value: 'unico-abc-123' }]
    };

    const ghostpayResponse = await fetch('https://app.ghostspaysv1.com/api/v1/transaction.purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey
      },
      body: JSON.stringify(payload)
    });

    const data = await ghostpayResponse.json();

    if (!ghostpayResponse.ok) {
      return NextResponse.json(
        { error: data.message || 'Falha ao criar pagamento.' },
        { status: ghostpayResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
