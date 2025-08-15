
'use server';

import { NextRequest, NextResponse } from 'next/server';
import getConfig from 'next/config';
import { gerarCPFValido } from '@/lib/utils';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';
import { PaymentPayload } from '@/interfaces/types';

const { serverRuntimeConfig } = getConfig();

const allowedOrigins = [
    'http://localhost:3000',
    'https://recargajogo.com.de',
    'https://www.recargajogo.com.de'
];

function isOriginAllowed(request: NextRequest): boolean {
    const referer = request.headers.get('referer');
    if (!referer) return false;
    return allowedOrigins.some(origin => referer.startsWith(origin));
}


async function notifyDiscord(message: string, payload?: any) {
    const discordWebhookUrl = serverRuntimeConfig.DISCORD_WEBHOOK_URL;
    if (!discordWebhookUrl) {
        console.error("DISCORD_WEBHOOK_URL não está configurada.");
        return;
    }

    let content = message;
    if (payload) {
        const payloadString = JSON.stringify(payload, null, 2);
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

export async function POST(request: NextRequest) {
    if (!isOriginAllowed(request)) {
        return new NextResponse(JSON.stringify({ error: 'Clonou errado kk' }), { status: 403 });
    }

    let requestBody: PaymentPayload;
    try {
        requestBody = await request.json();
        await notifyDiscord('🔄 [Criação de Pagamento - BuckPay] Requisição recebida:', requestBody);

        const { name, email, phone, amount, items, externalId, utmQuery } = requestBody;

        const apiToken = serverRuntimeConfig.BUCKPAY_API_TOKEN;
        if (!apiToken) {
            const errorMsg = "❌ [Criação de Pagamento - BuckPay] ERRO: BUCKPAY_API_TOKEN não definida.";
            await notifyDiscord(errorMsg);
            return new NextResponse(JSON.stringify({ error: 'Configuração do servidor incompleta.' }), { status: 500 });
        }

        const parsedAmount = parseFloat(String(amount));
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return new NextResponse(JSON.stringify({ error: 'Valor total do pagamento (amount) inválido.' }), { status: 400 });
        }
        const amountInCents = Math.round(parsedAmount * 100);

        if (!Array.isArray(items) || items.length === 0) {
            return new NextResponse(JSON.stringify({ error: 'Itens do pedido inválidos.' }), { status: 400 });
        }
        
        const finalCpf = (requestBody.cpf || gerarCPFValido()).replace(/\D/g, '');
        const utmParams = utmQuery || {};
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
                ref: utmParams['ref'] || null,
                src: utmParams['src'] || utmParams['utm_source'] || null,
                sck: utmParams['sck'] || null,
                utm_source: utmParams['utm_source'] || null,
                utm_medium: utmParams['utm_medium'] || null,
                utm_campaign: utmParams['utm_campaign'] || null,
                utm_id: utmParams['utm_id'] || null,
                utm_term: utmParams['utm_term'] || null,
                utm_content: utmParams['utm_content'] || null,
            }
        };

        await notifyDiscord("📤 [Criação de Pagamento - BuckPay] Enviando payload...", payloadForBuckPay);

        const buckpayResponse = await fetch('https://api.realtechdev.com.br/v1/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`,
                'User-Agent': 'Buckpay API'
            },
            body: JSON.stringify(payloadForBuckPay)
        });

        const responseData = await buckpayResponse.json();
        
        if (!buckpayResponse.ok) {
            const errorMsg = `❌ [Criação de Pagamento - BuckPay] Erro da API BuckPay (HTTP ${buckpayResponse.status}): ${responseData.error?.message || 'Falha'}`;
            await notifyDiscord(errorMsg, responseData.error);
            return new NextResponse(
                JSON.stringify({ error: responseData.error?.message || 'Falha na BuckPay.', details: responseData.error?.detail }),
                { status: buckpayResponse.status }
            );
        }

        await notifyDiscord(`✅ [Criação de Pagamento - BuckPay] Resposta da BuckPay (HTTP ${buckpayResponse.status}) recebida:`, responseData);
        
        const buckpayData = responseData.data;
        if (buckpayData && buckpayData.id) {
            const utmifyPayload: UtmifyOrderPayload = {
                orderId: buckpayData.id,
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
                    country: 'BR',
                    ip: ip,
                },
                products: items.map((item: any) => ({
                    id: item.id || `prod_${Date.now()}`,
                    name: item.title,
                    planId: null,
                    planName: null,
                    quantity: item.quantity,
                    priceInCents: Math.round(item.unitPrice * 100),
                })),
                trackingParameters: {
                    src: utmParams['src'] || utmParams['utm_source'] || null,
                    sck: utmParams['sck'] || null,
                    utm_source: utmParams['utm_source'] || null,
                    utm_campaign: utmParams['utm_campaign'] || null,
                    utm_medium: utmParams['utm_medium'] || null,
                    utm_content: utmParams['utm_content'] || null,
                    utm_term: utmParams['utm_term'] || null,
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
                await notifyDiscord(`📦 [Criação de Pagamento] Enviando payload PENDENTE para Utmify para o pedido ${buckpayData.id}:`, utmifyPayload);
                await sendOrderToUtmify(utmifyPayload);
                await notifyDiscord(`✅ [Criação de Pagamento] Payload PENDENTE enviado para Utmify com sucesso (ID: ${buckpayData.id}).`);
            } catch (utmifyError: any) {
                 await notifyDiscord(`❌ [Criação de Pagamento] Erro durante o envio PENDENTE para Utmify (ID: ${buckpayData.id}):`, utmifyError.message);
            }
        }
        
        return new NextResponse(JSON.stringify(responseData), {
          status: 200
        });

    } catch (error: any) {
        const errorMsg = `❌ [Criação de Pagamento] Erro fatal no servidor: ${error.message}`;
        await notifyDiscord(errorMsg, request.body);
        return new NextResponse(JSON.stringify({ error: error.message || 'Erro interno do servidor.' }), {
          status: 500
        });
    }
}

export async function GET(request: NextRequest) {
  if (!isOriginAllowed(request)) {
      return new NextResponse(JSON.stringify({ error: 'Clonou errado kk' }), { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const externalId = searchParams.get('externalId');

  if (!externalId) {
    return new NextResponse(JSON.stringify({ error: 'externalId é obrigatório.' }), { status: 400 });
  }

  try {
    const apiToken = serverRuntimeConfig.BUCKPAY_API_TOKEN;
    if (!apiToken) {
      console.error("[create-payment GET] ERRO: BUCKPAY_API_TOKEN não definida.");
      return new NextResponse(JSON.stringify({ error: 'Configuração do servidor incompleta.' }), { status: 500 });
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
            status: 200
        });
    }

    const statusData = await buckpayStatusResponse.json();
    
    if (!buckpayStatusResponse.ok) {
        return new NextResponse(
            JSON.stringify({ error: statusData.error?.message || 'Falha ao consultar status.', details: statusData.error?.detail }),
            { status: buckpayStatusResponse.status }
        );
    }
    
    const paymentStatus = statusData.data?.status?.toUpperCase() || 'UNKNOWN'; 

    return new NextResponse(JSON.stringify({ status: paymentStatus }), {
      status: 200,
    });

  } catch (error: any) {
    console.error("[create-payment GET] ERRO INTERNO NO SERVIDOR (GET STATUS):", error);
    return new NextResponse(JSON.stringify({ error: error.message || 'Erro interno do servidor.' }), { status: 500 });
  }
}
