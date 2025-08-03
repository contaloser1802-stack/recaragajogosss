
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { gerarCPFValido } from '@/lib/utils';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';

// Função para enviar logs para o Discord
async function notifyDiscord(message: string, payload?: any) {
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!discordWebhookUrl) {
        console.error("DISCORD_WEBHOOK_URL não está configurada.");
        return;
    }

    let content = message;
    if (payload) {
        const payloadString = JSON.stringify(payload, null, 2);
        // O Discord tem um limite de 2000 caracteres por mensagem. 1800 é um valor seguro.
        const truncatedPayload = payloadString.length > 1800 ? payloadString.substring(0, 1800) + '...' : payloadString;
        content += `\n**Payload:**\n\`\`\`json\n${truncatedPayload}\n\`\`\``;
    }

    try {
        await fetch(discordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
    } catch (discordError) {
        console.error("Falha ao enviar log para o Discord:", discordError);
    }
}


// Função para obter dados de geolocalização do IP
async function getGeoData(ip: string) {
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { countryCode: 'BR' }; 
  }
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    const data = await response.json();
    return {
      countryCode: data.countryCode || 'BR',
    };
  } catch (error) {
    console.error(`[GeoData] Falha ao obter dados de geolocalização para o IP ${ip}:`, error);
    return { countryCode: 'BR' }; 
  }
}

const allowedOrigins = [
  'https://recargajogo.com',
  'https://www.recargajogo.com',
  'http://localhost:3000',
  process.env.NEXT_PUBLIC_APP_URL || ''
].filter(Boolean);

const getOrigin = (request: NextRequest): string => {
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || '*';
};

// Lida com requisições OPTIONS (pre-flight CORS)
export async function OPTIONS(request: NextRequest) {
  const origin = getOrigin(request);
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Access-Control-Allow-Credentials', 'true');

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

// Lida com requisições POST para criar o pagamento (compra)
export async function POST(request: NextRequest) {
  const origin = getOrigin(request);
  const headers = new Headers();
  headers.set('Access-control-Allow-Origin', origin);
  headers.set('Content-Type', 'application/json');
  headers.set('Access-Control-Allow-Credentials', 'true');
  
  let body;

  try {
    body = await request.json();
    await notifyDiscord('🔄 [Criação de Pagamento] Requisição recebida:', body);

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

    const apiToken = process.env.BUCKPAY_API_TOKEN;
    if (!apiToken) {
      const errorMsg = "❌ [Criação de Pagamento] ERRO: BUCKPAY_API_TOKEN não definida no ambiente do servidor.";
      await notifyDiscord(errorMsg);
      return new NextResponse(JSON.stringify({ error: 'Chave de API do BuckPay não configurada no servidor.' }), { status: 500, headers });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        const errorMsg = `❌ [Criação de Pagamento] Validação de entrada: 'amount' inválido ou ausente - Recebido: ${amount}`;
        await notifyDiscord(errorMsg, body);
        return new NextResponse(JSON.stringify({ error: 'Valor total do pagamento (amount) inválido ou ausente.' }), { status: 400, headers });
    }
    const amountInCents = Math.round(parsedAmount * 100);

    if (!Array.isArray(items) || items.length === 0) {
        const errorMsg = "[Criação de Pagamento] Validação de entrada: 'items' inválido ou vazio.";
        await notifyDiscord(errorMsg, body);
        return new NextResponse(JSON.stringify({ error: 'Itens do pedido inválidos ou ausentes.' }), { status: 400, headers });
    }
    
    const finalCpf = (cpf || gerarCPFValido()).replace(/\D/g, '');
    const utmParams = new URLSearchParams(utmQuery);
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';

    const payloadForBuckPay = {
      external_id: externalId,
      payment_method: 'pix',
      amount: amountInCents,
      buyer: {
        name,
        email,
        document: finalCpf,
        phone: `55${phone.replace(/\D/g, '')}`,
        ip,
      },
      items: items.map((item: any) => ({
        id: item.id || `prod_${Date.now()}`,
        name: item.title,
        amount: Math.round(item.unitPrice * 100),
        quantity: item.quantity,
      })),
      tracking: {
        ref: utmParams.get('ref') || null,
        src: utmParams.get('utm_source') || null,
        sck: utmParams.get('sck') || null,
        utm_source: utmParams.get('utm_source') || null,
        utm_medium: utmParams.get('utm_medium') || null,
        utm_campaign: utmParams.get('utm_campaign') || null,
        utm_id: utmParams.get('utm_id') || null,
        utm_term: utmParams.get('utm_term') || null,
        utm_content: utmParams.get('utm_content') || null,
      }
    };

    await notifyDiscord("📤 [Criação de Pagamento] Enviando payload para BuckPay...", payloadForBuckPay);

    const buckpayResponse = await fetch('https://api.realtechdev.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        'User-Agent': 'Buckpay API'
      },
      body: JSON.stringify(payloadForBuckPay)
    });

    let responseData;
    const contentType = buckpayResponse.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      responseData = await buckpayResponse.json();
    } else {
      const textData = await buckpayResponse.text();
      const errorMsg = `❌ [Criação de Pagamento] Erro: Resposta da BuckPay (HTTP ${buckpayResponse.status}) não é JSON.`;
      await notifyDiscord(errorMsg, textData);
      return new NextResponse(
        JSON.stringify({ error: 'Falha ao criar pagamento: Resposta inesperada da BuckPay', details: textData }),
        { status: buckpayResponse.status, headers }
      );
    }
    
    if (!buckpayResponse.ok) {
        const errorMsg = `❌ [Criação de Pagamento] Erro da API BuckPay (HTTP ${buckpayResponse.status}): ${responseData.error?.message || 'Falha ao criar pagamento.'}`;
        await notifyDiscord(errorMsg, responseData.error);
        return new NextResponse(
            JSON.stringify({ error: responseData.error?.message || 'Falha ao criar pagamento na BuckPay.', details: responseData.error?.detail }),
            { status: buckpayResponse.status, headers }
        );
    }

    await notifyDiscord(`✅ [Criação de Pagamento] Resposta da BuckPay (HTTP ${buckpayResponse.status}) recebida:`, responseData);
    
    const paymentData = responseData.data;

    if (paymentData && paymentData.id) {
        const geoData = await getGeoData(ip);

        const utmifyPayload: UtmifyOrderPayload = {
            orderId: paymentData.id,
            platform: 'RecargaJogo',
            paymentMethod: 'pix',
            status: 'waiting_payment',
            createdAt: formatToUtmifyDate(new Date(paymentData.created_at || Date.now())),
            approvedDate: null,
            refundedAt: null,
            customer: {
                name: payloadForBuckPay.buyer.name,
                email: payloadForBuckPay.buyer.email,
                phone: payloadForBuckPay.buyer.phone.replace(/^55/, ''),
                document: payloadForBuckPay.buyer.document,
                country: geoData.countryCode,
                ip: ip,
            },
            products: items.map((item: any) => ({
                id: item.id || `prod_${Date.now()}`,
                name: item.title,
                planId: null,
                planName: null,
                quantity: item.quantity,
                priceInCents: Math.round(item.unitPrice * 100)
            })),
            trackingParameters: {
                src: payloadForBuckPay.tracking.src,
                sck: payloadForBuckPay.tracking.sck,
                utm_source: payloadForBuckPay.tracking.utm_source,
                utm_campaign: payloadForBuckPay.tracking.utm_campaign,
                utm_medium: payloadForBuckPay.tracking.utm_medium,
                utm_content: payloadForBuckPay.tracking.utm_content,
                utm_term: payloadForBuckPay.tracking.utm_term,
            },
            commission: {
                totalPriceInCents: paymentData.total_amount || 0,
                gatewayFeeInCents: 0, 
                userCommissionInCents: paymentData.total_amount || 0, 
                currency: 'BRL',
            },
            isTest: false,
        };

        try {
            await notifyDiscord(`📦 [Criação de Pagamento] Enviando payload PENDENTE para Utmify para o pedido '${paymentData.id}':`, utmifyPayload);
            await sendOrderToUtmify(utmifyPayload);
            await notifyDiscord(`✅ [Criação de Pagamento] Dados de pagamento pendente (ID: ${paymentData.id}) enviados para Utmify com sucesso.`);

        } catch (error: any) {
            await notifyDiscord(`❌ [Criação de Pagamento] Erro durante o envio para Utmify (ID: ${paymentData.id}):`, error.message);
        }
    }

    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers
    });

  } catch (error: any) {
    const errorMsg = `❌ [Criação de Pagamento] Erro fatal no servidor: ${error.message}`;
    await notifyDiscord(errorMsg, body);
    return new NextResponse(JSON.stringify({ error: error.message || 'Erro interno do servidor ao processar pagamento.' }), {
      status: 500,
      headers
    });
  }
}

// Lida com requisições GET para verificar o status do pagamento (polling)
export async function GET(request: NextRequest) {
  const origin = getOrigin(request);
  const { searchParams } = new URL(request.url);
  const externalId = searchParams.get('externalId');
  
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Content-Type', 'application/json');
  headers.set('Access-Control-Allow-Credentials', 'true');

  if (!externalId) {
    return new NextResponse(JSON.stringify({ error: 'externalId é obrigatório para consulta de status.' }), { status: 400, headers });
  }

  try {
    const apiToken = process.env.BUCKPAY_API_TOKEN;
    if (!apiToken) {
      console.error("[create-payment GET] ERRO: BUCKPAY_API_TOKEN não definida para consulta de status.");
      return new NextResponse(JSON.stringify({ error: 'Chave de API do BuckPay não configurada no servidor.' }), { status: 500, headers });
    }

    const buckpayStatusResponse = await fetch(`https://api.realtechdev.com.br/v1/transactions/external_id/${externalId}`, {
      method: 'GET', 
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Buckpay API'
      },
    });

    if (buckpayStatusResponse.status === 404) {
        return new NextResponse(JSON.stringify({ status: 'PENDING' }), {
            status: 200,
            headers
        });
    }

    let statusData;
    const contentType = buckpayStatusResponse.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      statusData = await buckpayStatusResponse.json();
    } else {
      const textData = await buckpayStatusResponse.text();
      return new NextResponse(
        JSON.stringify({ error: 'Falha ao consultar status: Resposta inesperada da BuckPay', details: textData }),
        { status: buckpayStatusResponse.status, headers }
      );
    }
    
    if (!buckpayStatusResponse.ok) {
        return new NextResponse(
            JSON.stringify({ error: statusData.error?.message || 'Falha ao consultar status do pagamento.', details: statusData.error?.detail }),
            { status: buckpayStatusResponse.status, headers }
        );
    }
    
    const paymentStatus = statusData.data?.status?.toUpperCase() || 'UNKNOWN'; 

    return new NextResponse(JSON.stringify({ status: paymentStatus }), {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("[create-payment GET] ERRO INTERNO NO SERVIDOR (GET STATUS):", error);
    return new NextResponse(JSON.stringify({ error: error.message || 'Erro interno do servidor ao consultar status.' }), { status: 500, headers });
  }
}
