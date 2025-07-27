import { NextRequest, NextResponse } from 'next/server'

// This is a temporary solution to allow all origins.
// In a production environment, you should restrict this to your domain.
const allowCors = (fn: (req: NextRequest) => Promise<Response>) => async (req: NextRequest) => {
  const response = await fn(req);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-PUBLIC-KEY, X-SECRET-KEY');
  return response;
};

async function handler(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const body = await request.json();

    const publicKey = process.env.GHOSTSPAY_PUBLIC_KEY;
    const secretKey = process.env.GHOSTSPAY_SECRET_KEY;

    if (!publicKey || !secretKey) {
        throw new Error("API keys are not configured on the server.");
    }
    
    const ghostpayResponse = await fetch('https://api.ghostspay.com/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PUBLIC-KEY': publicKey,
        'X-SECRET-KEY': secretKey
      },
      body: JSON.stringify(body)
    });

    const data = await ghostpayResponse.json();

    if (!ghostpayResponse.ok) {
        // Log the detailed error from Ghostspay if available
        console.error("Ghostspay API Error:", data);
        return NextResponse.json(
            { error: data.message || 'Falha ao criar pagamento.' },
            { status: ghostpayResponse.status }
        );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}


export const POST = allowCors(handler);
export const OPTIONS = allowCors(async () => new NextResponse(null, { status: 204 }));
