'use server';

import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';
import { gerarCPFValido } from '@/lib/utils';
import axios from 'axios';

// Função para obter dados de geolocalização do IP
async function getGeoData(ip: string) {
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { countryCode: 'BR' }; 
  }
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode`);
    return {
      countryCode: response.data.countryCode || 'BR',
    };
  } catch (error) {
    console.error(`[GeoData] Falha ao obter dados de geolocalização para o IP ${ip}:`, error);
    return { countryCode: 'BR' }; 
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
  const origin = request.headers.get('origin') || '*';
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

    const apiToken = process.env.BUCKPAY_API_TOKEN;
    if (!apiToken) {
      console.error("[create-payment POST] ERRO: BUCKPAY_API_TOKEN não definida no ambiente do servidor.");
      return NextResponse.json({ error: 'Chave de API do BuckPay não configurada no servidor.' }, { status: 500 });
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

    // Extrair o produto principal e as ofertas
    const mainProduct = items[0];
    const offers = items.slice(1);
    
    // BuckPay parece esperar apenas uma oferta, então pegamos a primeira se houver.
    const offerPayload = offers.length > 0 ? {
        id: offers[0].id || null,
        name: offers[0].title || null,
        discount_price: Math.round(parseFloat(offers[0].unitPrice || 0) * 100),
        quantity: offers[0].quantity || 1,
    } : null;

    const finalCpf = (cpf || gerarCPFValido()).replace(/\D/g, '');
    const utmParams = new URLSearchParams(utmQuery);

    const payloadForBuckPay = {
      external_id: externalId,
      payment_method: 'pix',
      amount: amountInCents,
      buyer: {
        name,
        email,
        document: finalCpf,
        phone: `55${phone.replace(/\D/g, '')}`,
      },
      product: {
        id: mainProduct.id || null,
        name: mainProduct.title || null
      },
      ...(offerPayload && { offer: offerPayload }),
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

    console.log("[create-payment POST] PAYLOAD ENVIADO PARA BUCKPAY:", JSON.stringify(payloadForBuckPay, null, 2));

    const buckpayResponse = await fetch('https://api.realtechdev.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify(payloadForBuckPay)
    });

    let responseData;
    const contentType = buckpayResponse.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      responseData = await buckpayResponse.json();
    } else {
      const textData = await buckpayResponse.text();
      console.error(`[create-payment POST] ❌ Resposta da BuckPay (HTTP ${buckpayResponse.status}, Não-JSON):`, textData);
      return NextResponse.json(
        { error: 'Falha ao criar pagamento: Resposta inesperada da BuckPay', details: textData },
        { status: buckpayResponse.status }
      );
    }
    
    if (!buckpayResponse.ok) {
        console.error("[create-payment POST] ERRO DA BUCKPAY:", responseData);
        return NextResponse.json(
            { error: responseData.error?.message || 'Falha ao criar pagamento na BuckPay.', details: responseData.error?.detail },
            { status: buckpayResponse.status }
        );
    }

    console.log(`[create-payment POST] ✅ Resposta da BuckPay (HTTP ${buckpayResponse.status}, JSON):`, JSON.stringify(responseData, null, 2));
    
    // A documentação retorna `data`, então acessamos a resposta dentro de `data`
    const paymentData = responseData.data;

    if (paymentData.id) {
        // Envio para Utmify já é feito pelo webhook de "transaction.created" da BuckPay,
        // então não é mais necessário enviar o status 'waiting_payment' aqui.
        // Apenas logamos que o fluxo está correto.
        console.log(`[create-payment POST] Pagamento criado (ID: ${paymentData.id}). Aguardando webhook de confirmação.`);
    }

    return new NextResponse(JSON.stringify(paymentData), {
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
  const origin = request.headers.get('origin') || '*';
  const { searchParams } = new URL(request.url);
  const externalId = searchParams.get('externalId');

  console.log(`[create-payment GET] Consultando status para externalId: ${externalId}`);

  if (!externalId) {
    return NextResponse.json({ error: 'externalId é obrigatório para consulta de status.' }, { status: 400 });
  }

  try {
    const apiToken = process.env.BUCKPAY_API_TOKEN;
    if (!apiToken) {
      console.error("[create-payment GET] ERRO: BUCKPAY_API_TOKEN não definida para consulta de status.");
      return NextResponse.json({ error: 'Chave de API do BuckPay não configurada no servidor.' }, { status: 500 });
    }

    const buckpayStatusResponse = await fetch(`https://api.realtechdev.com.br/v1/transactions/external_id/${externalId}`, {
      method: 'GET', 
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
    });

    if (buckpayStatusResponse.status === 404) {
        console.log(`[create-payment GET] Transação com externalId ${externalId} não encontrada na BuckPay. Retornando status PENDING para a UI.`);
        return NextResponse.json({ status: 'PENDING' }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': origin, 'Content-Type': 'application/json' }
        });
    }

    let statusData;
    const contentType = buckpayStatusResponse.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      statusData = await buckpayStatusResponse.json();
    } else {
      const textData = await buckpayStatusResponse.text();
      console.error(`[create-payment GET] ❌ Resposta de Status da BuckPay (HTTP ${buckpayStatusResponse.status}, Não-JSON):`, textData);
      return NextResponse.json(
        { error: 'Falha ao consultar status: Resposta inesperada da BuckPay', details: textData },
        { status: buckpayStatusResponse.status }
      );
    }
    
    if (!buckpayStatusResponse.ok) {
        console.error("[create-payment GET] ERRO AO CONSULTAR STATUS NA BUCKPAY:", statusData);
        return NextResponse.json(
            { error: statusData.error?.message || 'Falha ao consultar status do pagamento.', details: statusData.error?.detail },
            { status: buckpayStatusResponse.status }
        );
    }
    
    console.log(`[create-payment GET] ✅ Resposta de Status da BuckPay (HTTP ${buckpayStatusResponse.status}, JSON):`, JSON.stringify(statusData, null, 2));

    // Acessa o status dentro do objeto `data`
    const paymentStatus = statusData.data?.status?.toUpperCase() || 'UNKNOWN'; 

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
