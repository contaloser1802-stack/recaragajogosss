import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';


// !!! IMPORTANTE !!!
// Ajuste estas URLs para corresponder EXATAMENTE ao domínio do seu frontend.
// Remova a barra final se o navegador não a envia no cabeçalho 'Origin'.
// Adicione 'http://localhost:3000' para testes locais.
const BASE_URL_DEV = 'https://6000-firebase-studio-1750702713496.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev';
const BASE_URL_PROD = 'https://recargajogo.com.br'; // Substitua pelo seu domínio de produção real

const allowedOrigins = [
  BASE_URL_DEV,
  // Adicione a versão com 'www' se aplicável, sem a barra final
  'https://www.6000-firebase-studio-1750702713496.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev',
  BASE_URL_PROD,
  'https://www.recargajogo.com.br',
  'http://localhost:3000', // Para desenvolvimento local
];

// Lida com requisições OPTIONS (pre-flight CORS)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  console.log(`[create-payment OPTIONS] Recebida requisição OPTIONS de Origin: ${origin}`);

  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400'); // Cache pre-flight por 24 horas

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

// Lida com requisições POST para criar o pagamento (compra)
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  console.log(`[create-payment POST] Recebida requisição POST de Origin: ${origin}`);
  console.log(`[create-payment POST] URL da Requisição: ${request.url}`);

  try {
    const body = await request.json();
    console.log("[create-payment POST] Corpo da requisição recebido:", JSON.stringify(body, null, 2));

    const { 
      name, 
      email, 
      cpf, 
      phone, 
      amount, 
      items,  
      externalId, 
      utmQuery 
    } = body;

    const secretKey = process.env.GHOSTPAY_SECRET_KEY;
    if (!secretKey) {
      console.error("[create-payment POST] ERRO: GHOSTPAY_SECRET_KEY não definida no ambiente do servidor.");
      return NextResponse.json({ error: 'Chave de API do GhostPay não configurada no servidor.' }, { status: 500 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error(`[create-payment POST] Validação de entrada: 'amount' inválido ou ausente - Recebido: ${amount}`);
        return NextResponse.json({ error: 'Valor total do pagamento (amount) inválido ou ausente.' }, { status: 400 });
    }
    const amountInCents = Math.round(parsedAmount * 100);

    if (!Array.isArray(items) || items.length === 0) {
        console.error("[create-payment POST] Validação de entrada: 'items' inválido ou vazio.");
        return NextResponse.json({ error: 'Itens do pedido inválidos ou ausentes.' }, { status: 400 });
    }

    let calculatedTotalFromItems = 0;
    const formattedItems = items.map((item: any) => {
      const unitPriceInCents = Math.round(parseFloat(item.unitPrice || item.price) * 100); 
      const quantity = item.quantity ? parseInt(item.quantity) : 1;

      if (isNaN(unitPriceInCents) || unitPriceInCents <= 0 || isNaN(quantity) || quantity <= 0) {
        throw new Error(`Dados inválidos para o item '${item.title || item.name || "desconhecido"}'. Verifique unitPrice e quantity.`);
      }
      
      calculatedTotalFromItems += unitPriceInCents * quantity;

      return {
        unitPrice: unitPriceInCents,
        title: item.title || item.name || 'Produto Sem Título',
        quantity: quantity,
        tangible: item.tangible !== undefined ? item.tangible : false
      };
    });

    if (amountInCents !== calculatedTotalFromItems) {
        console.warn(`[create-payment POST] AVISO: O 'amount' total (${amountInCents}) não corresponde à soma dos itens (${calculatedTotalFromItems}).`);
    }

    // Determine a URL base para o ambiente atual
    const currentBaseUrl = process.env.NODE_ENV === 'production' ? BASE_URL_PROD : (origin || BASE_URL_DEV);

    const payloadForGhostPay = {
      name,
      email,
      cpf: cpf.replace(/\D/g, ''),
      phone: phone.replace(/\D/g, ''),
      paymentMethod: 'PIX',
      amount: amountInCents,
      traceable: true,
      items: formattedItems,
      externalId: externalId,
      // Use a URL base dinâmica para postback e checkout
      postbackUrl: `${currentBaseUrl}/api/ghostpay-webhook`, // Seu webhook
      checkoutUrl: `${currentBaseUrl}/checkout`,
      referrerUrl: currentBaseUrl,
      utmQuery: utmQuery,
      fingerPrints: [{ provider: 'browser', value: 'unico-abc-123' }]
    };

    console.log("[create-payment POST] PAYLOAD ENVIADO PARA GHOSTPAY:", JSON.stringify(payloadForGhostPay, null, 2));

    const ghostpayResponse = await fetch('https://app.ghostspaysv1.com/api/v1/transaction.purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey
      },
      body: JSON.stringify(payloadForGhostPay)
    });

    let data;
    const contentType = ghostpayResponse.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await ghostpayResponse.json();
      console.log(`[create-payment POST] ✅ Resposta da GhostPay (HTTP ${ghostpayResponse.status}, JSON):`, JSON.stringify(data, null, 2));
    } else {
      data = await ghostpayResponse.text();
      console.error(`[create-payment POST] ❌ Resposta da GhostPay (HTTP ${ghostpayResponse.status}, Não-JSON):`, data);
      return NextResponse.json(
        { error: 'Falha ao criar pagamento: Resposta inesperada da GhostPay', details: data },
        {
          status: ghostpayResponse.status,
          headers: { 'Access-Control-Allow-Origin': origin, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!ghostpayResponse.ok) {
      console.error("[create-payment POST] ERRO DA GHOSTPAY:", data);
      return NextResponse.json(
        { error: data.message || data.error || 'Falha ao criar pagamento na GhostPay.' },
        {
          status: ghostpayResponse.status,
          headers: { 'Access-Control-Allow-Origin': origin, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Se o pagamento foi criado com sucesso, envie o status PENDENTE para a Utmify
    if (data.id) {
        console.log(`[create-payment POST] Pagamento criado (ID: ${data.id}). Enviando status 'waiting_payment' para Utmify.`);
        
        const utmParams = new URLSearchParams(utmQuery);

        const utmifyPayload: UtmifyOrderPayload = {
            orderId: data.id,
            platform: 'RecargaJogo', // Nome da sua plataforma
            paymentMethod: 'pix',
            status: 'waiting_payment',
            createdAt: formatToUtmifyDate(new Date()),
            approvedDate: null,
            refundedAt: null,
            customer: {
                name: name,
                email: email,
                phone: phone.replace(/\D/g, ''),
                document: cpf.replace(/\D/g, ''),
                country: 'BR',
                ip: request.ip ?? null,
            },
            products: items.map((item: any) => ({
                id: item.id || `prod_${Date.now()}`,
                name: item.title || 'Produto',
                planId: null,
                planName: null,
                quantity: item.quantity || 1,
                priceInCents: Math.round(parseFloat(item.unitPrice || item.price) * 100),
            })),
            trackingParameters: {
                src: utmParams.get('utm_source'),
                sck: utmParams.get('sck'),
                utm_source: utmParams.get('utm_source'),
                utm_campaign: utmParams.get('utm_campaign'),
                utm_medium: utmParams.get('utm_medium'),
                utm_content: utmParams.get('utm_content'),
                utm_term: utmParams.get('utm_term'),
            },
            commission: {
                totalPriceInCents: amountInCents,
                gatewayFeeInCents: 0, // A GhostPay não informa a taxa na criação
                userCommissionInCents: amountInCents, // Valor líquido = valor total
                currency: 'BRL',
            },
            isTest: false,
        };

        try {
            await sendOrderToUtmify(utmifyPayload);
            console.log(`[create-payment POST] Dados do pedido pendente ${data.id} enviados para Utmify com sucesso.`);
        } catch (utmifyError: any) {
            console.error(`[create-payment POST] Erro ao enviar dados PENDENTES para Utmify para o pedido ${data.id}:`, utmifyError.message);
            // Não bloqueie o fluxo principal por falha no envio para a Utmify
        }
    }


    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error("[create-payment POST] ERRO INTERNO NO SERVIDOR:", error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor ao processar pagamento.' }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': 'application/json'
      }
    });
  }
}

// Lida com requisições GET para verificar o status do pagamento (polling)
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  console.log(`[create-payment GET] Recebida requisição GET de Origin: ${origin}`);
  console.log(`[create-payment GET] URL da Requisição: ${request.url}`);

  const { searchParams } = new URL(request.url);
  const externalId = searchParams.get('externalId');

  if (!externalId) {
    return NextResponse.json({ error: 'externalId é obrigatório para consulta de status.' }, { status: 400 });
  }

  try {
    const secretKey = process.env.GHOSTPAY_SECRET_KEY;
    if (!secretKey) {
      console.error("[create-payment GET] ERRO: GHOSTPAY_SECRET_KEY não definida para consulta de status.");
      return NextResponse.json({ error: 'Chave de API do GhostPay não configurada no servidor.' }, { status: 500 });
    }

    const ghostpayStatusResponse = await fetch(`https://app.ghostspaysv1.com/api/v1/transaction.status?externalId=${externalId}`, {
      method: 'GET', 
      headers: {
        'Authorization': secretKey,
        'Content-Type': 'application/json'
      },
    });

    let statusData;
    const contentType = ghostpayStatusResponse.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      statusData = await ghostpayStatusResponse.json();
      console.log(`[create-payment GET] ✅ Resposta de Status da GhostPay (HTTP ${ghostpayStatusResponse.status}, JSON):`, JSON.stringify(statusData, null, 2));
    } else {
      statusData = await ghostpayStatusResponse.text();
      console.error(`[create-payment GET] ❌ Resposta de Status da GhostPay (HTTP ${ghostpayStatusResponse.status}, Não-JSON):`, statusData);
      return NextResponse.json(
        { error: 'Falha ao consultar status: Resposta inesperada da GhostPay', details: statusData },
        { status: ghostpayStatusResponse.status }
      );
    }

    if (!ghostpayStatusResponse.ok) {
      console.error("[create-payment GET] ERRO AO CONSULTAR STATUS NA GHOSTPAY:", statusData);
      return NextResponse.json(
        { error: statusData.message || statusData.error || 'Falha ao consultar status do pagamento.' },
        { status: ghostpayStatusResponse.status }
      );
    }

    const paymentStatus = statusData.status || 'UNKNOWN'; 

    return NextResponse.json({ status: paymentStatus }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error("[create-payment GET] ERRO INTERNO NO SERVIDOR (GET STATUS):", error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor ao consultar status.' }, { status: 500 });
  }
}
