import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';
import { gerarCPFValido } from '@/lib/utils';
import axios from 'axios';

// Função para obter dados de geolocalização do IP
async function getGeoData(ip: string) {
  // Evitar chamadas para IPs locais/privados
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { countryCode: 'BR' }; // Retorna 'BR' como padrão para testes locais
  }
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode`);
    return {
      countryCode: response.data.countryCode || 'BR',
    };
  } catch (error) {
    console.error(`[GeoData] Falha ao obter dados de geolocalização para o IP ${ip}:`, error);
    return { countryCode: 'BR' }; // Retorna 'BR' em caso de erro
  }
}


// Lida com requisições OPTIONS (pre-flight CORS)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  console.log(`[create-payment OPTIONS] Recebida requisição OPTIONS de Origin: ${origin}`);

  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  headers.set('Access-control-allow-headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

// Lida com requisições POST para criar o pagamento (compra)
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  console.log(`[create-payment POST] Recebida requisição POST de Origin: ${origin}`);

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
      const unitPriceInCents = Math.round(parseFloat(item.unitPrice || 0) * 100);
      const quantity = parseInt(item.quantity || 1);

      if (isNaN(unitPriceInCents) || unitPriceInCents <= 0 || isNaN(quantity) || quantity <= 0) {
        throw new Error(`Dados inválidos para o item '${item.title || "desconhecido"}'. Verifique unitPrice e quantity.`);
      }
      
      calculatedTotalFromItems += unitPriceInCents * quantity;

      return {
        unitPrice: unitPriceInCents,
        title: item.title || 'Produto Sem Título',
        quantity: quantity,
        tangible: item.tangible !== undefined ? item.tangible : false
      };
    });

    if (amountInCents !== calculatedTotalFromItems) {
        console.warn(`[create-payment POST] AVISO: O 'amount' total (${amountInCents}) não corresponde à soma dos itens (${calculatedTotalFromItems}). Usando o 'amount' fornecido.`);
    }

    const host = request.headers.get('host') || '';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const currentBaseUrl = `${protocol}://${host}`;
    const finalCpf = (cpf || gerarCPFValido()).replace(/\D/g, '');

    const payloadForGhostPay = {
      name,
      email,
      cpf: finalCpf,
      phone: phone.replace(/\D/g, ''),
      paymentMethod: 'PIX',
      amount: amountInCents,
      traceable: true,
      items: formattedItems,
      externalId: externalId,
      postbackUrl: `${currentBaseUrl}/api/ghostpay-webhook`,
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
      const textData = await ghostpayResponse.text();
      console.error(`[create-payment POST] ❌ Resposta da GhostPay (HTTP ${ghostpayResponse.status}, Não-JSON):`, textData);
      return NextResponse.json(
        { error: 'Falha ao criar pagamento: Resposta inesperada da GhostPay', details: textData },
        { status: ghostpayResponse.status }
      );
    }

    if (!ghostpayResponse.ok) {
      console.error("[create-payment POST] ERRO DA GHOSTPAY:", data);
      return NextResponse.json(
        { error: data.message || data.error || 'Falha ao criar pagamento na GhostPay.' },
        { status: ghostpayResponse.status }
      );
    }
    
    if (data.id) {
        console.log(`[create-payment POST] Pagamento criado (ID: ${data.id}). Enviando status 'waiting_payment' para Utmify.`);
        
        const utmParams = new URLSearchParams(utmQuery);
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        const geoData = await getGeoData(ip);


        const utmifyPayload: UtmifyOrderPayload = {
            orderId: data.id,
            platform: 'RecargaJogo',
            paymentMethod: 'pix',
            status: 'waiting_payment',
            createdAt: formatToUtmifyDate(new Date()),
            approvedDate: null,
            refundedAt: null,
            customer: {
                name: name,
                email: email,
                phone: phone.replace(/\D/g, ''),
                document: finalCpf,
                country: geoData.countryCode,
                ip: ip,
            },
            products: items.map((item: any) => ({
                id: item.id || `prod_${Date.now()}`,
                name: item.title || 'Produto',
                planId: null,
                planName: null,
                quantity: item.quantity || 1,
                priceInCents: Math.round(parseFloat(item.unitPrice || 0) * 100),
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
                gatewayFeeInCents: 0,
                userCommissionInCents: amountInCents,
                currency: 'BRL',
            },
            isTest: false,
        };

        try {
            await sendOrderToUtmify(utmifyPayload);
            console.log(`[create-payment POST] Dados do pedido pendente ${data.id} enviados para Utmify com sucesso.`);
        } catch (utmifyError: any) {
            console.error(`[create-payment POST] Erro ao enviar dados PENDENTES para Utmify para o pedido ${data.id}:`, utmifyError.message);
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
      status: 500
    });
  }
}

// Lida com requisições GET para verificar o status do pagamento (polling)
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const { searchParams } = new URL(request.url);
  const externalId = searchParams.get('externalId');

  console.log(`[create-payment GET] Consultando status para externalId: ${externalId}`);

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

    // Se a transação não for encontrada (404), tratamos como pendente para a UI
    if (ghostpayStatusResponse.status === 404) {
        console.log(`[create-payment GET] Transação com externalId ${externalId} não encontrada na GhostPay. Retornando status PENDING para a UI.`);
        return NextResponse.json({ status: 'PENDING' }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': origin, 'Content-Type': 'application/json' }
        });
    }

    let statusData;
    const contentType = ghostpayStatusResponse.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      statusData = await ghostpayStatusResponse.json();
      console.log(`[create-payment GET] ✅ Resposta de Status da GhostPay (HTTP ${ghostpayStatusResponse.status}, JSON):`, JSON.stringify(statusData, null, 2));
    } else {
      const textData = await ghostpayStatusResponse.text();
      console.error(`[create-payment GET] ❌ Resposta de Status da GhostPay (HTTP ${ghostpayStatusResponse.status}, Não-JSON):`, textData);
      return NextResponse.json(
        { error: 'Falha ao consultar status: Resposta inesperada da GhostPay', details: textData },
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

    const paymentStatus = statusData.status?.toUpperCase() || 'UNKNOWN'; 

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
