import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = [
  'https://6000-firebase-studio-1750702713496.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev/',
  '6000-firebase-studio-1750702713496.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev/',
  'https://www.6000-firebase-studio-1750702713496.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev/'
]

// OPTIONS para preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  if (!allowedOrigins.includes(origin)) {
    return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}

// POST normal com CORS liberado
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  if (!allowedOrigins.includes(origin)) {
    return NextResponse.json({ error: 'Origin not allowed by CORS' }, { status: 403 })
  }

  try {
    const body = await request.json()

    // 👇 AQUI entra toda sua lógica original
    const { name, email, cpf, phone, amount, externalId, postbackUrl, items, utmQuery } = body;

    const secretKey = process.env.GHOSTPAY_SECRET_KEY;

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
      utmQuery,
      fingerPrints: [{ provider: 'browser', value: 'unico-abc-123' }]
    };

    const ghostpayResponse = await fetch('https://app.ghostspaysv1.com/api/v1/transaction.purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey!
      },
      body: JSON.stringify(payload)
    });

    const data = await ghostpayResponse.json();

    if (!ghostpayResponse.ok) {
      return NextResponse.json(
        { error: data.message || 'Falha ao criar pagamento.' },
        {
          status: ghostpayResponse.status,
          headers: {
            'Access-Control-Allow-Origin': origin
          }
        }
      );
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': origin
      }
    })
  }
}