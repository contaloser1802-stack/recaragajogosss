
'use server';

import { NextRequest, NextResponse } from 'next/server';
import getConfig from 'next/config';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';
import { getTransactionById } from '@/lib/buckpayService';

const { serverRuntimeConfig } = getConfig();

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
    let requestBody;
    try {
        requestBody = await request.json();
        await notifyDiscord('📢 [Webhook BuckPay - Payload recebido]:', requestBody);

        const { event, data } = requestBody;

        if (!event || !data || !data.id || !data.status) {
            const errorMsg = '❌ [Webhook BuckPay] Payload inválido.';
            await notifyDiscord(errorMsg, requestBody);
            return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
        }
        
        const transactionId = data.id;

        if (event === 'transaction.processed' && (data.status === 'paid' || data.status === 'approved')) {
            await notifyDiscord(`✅ [Webhook BuckPay] Evento APROVADO recebido. ID: ${transactionId}. Buscando detalhes completos...`);
            
            const apiToken = serverRuntimeConfig.BUCKPAY_API_TOKEN;
            if (!apiToken) {
                 const errorMsg = `❌ [Webhook BuckPay] BUCKPAY_API_TOKEN não configurado no servidor. Impossível buscar detalhes da transação.`;
                 await notifyDiscord(errorMsg);
                 return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500 });
            }

            const transactionDetails = await getTransactionById(transactionId, apiToken);
            
            if (!transactionDetails || !transactionDetails.data) {
                const errorMsg = `❌ [Webhook BuckPay] Falha ao obter detalhes completos da transação ${transactionId} da BuckPay.`;
                await notifyDiscord(errorMsg);
                return NextResponse.json({ error: 'Falha ao buscar detalhes da transação' }, { status: 500 });
            }
            
            const buckpayData = transactionDetails.data;
            const tracking = buckpayData.tracking || {};

            const utmifyPayload: UtmifyOrderPayload = {
                orderId: buckpayData.id,
                platform: 'RecargaJogo', 
                paymentMethod: 'pix',
                status: 'paid',
                createdAt: formatToUtmifyDate(new Date(buckpayData.created_at)),
                approvedDate: formatToUtmifyDate(new Date()),
                refundedAt: null,
                customer: {
                    name: buckpayData.buyer.name,
                    email: buckpayData.buyer.email,
                    phone: buckpayData.buyer.phone?.replace(/\D/g, '') || null,
                    document: buckpayData.buyer.document?.replace(/\D/g, '') || null,
                    country: 'BR',
                    ip: buckpayData.buyer.ip,
                },
                products: buckpayData.items.map((item: any) => ({
                    id: item.id || `prod_${Date.now()}`,
                    name: item.name,
                    planId: null,
                    planName: null,
                    quantity: item.quantity,
                    priceInCents: item.amount,
                })),
                trackingParameters: {
                    src: tracking.src || null,
                    sck: tracking.sck || null,
                    utm_source: tracking.utm_source || null,
                    utm_campaign: tracking.utm_campaign || null,
                    utm_medium: tracking.utm_medium || null,
                    utm_content: tracking.utm_content || null,
                    utm_term: tracking.utm_term || null,
                },
                commission: {
                    totalPriceInCents: buckpayData.amount,
                    gatewayFeeInCents: 0,
                    userCommissionInCents: buckpayData.amount, 
                    currency: 'BRL',
                },
                isTest: false, 
            };
            
            await notifyDiscord(`📦 [Webhook BuckPay] Enviando payload PAGO para Utmify (ID: ${transactionId}):`, utmifyPayload);
            await sendOrderToUtmify(utmifyPayload);
            await notifyDiscord(`✅ [Webhook BuckPay] Dados da transação APROVADA ${transactionId} enviados para Utmify com sucesso.`);

        } else {
            await notifyDiscord(`ℹ️ [Webhook BuckPay] Evento '${event}' com status '${data.status}' recebido para ID ${transactionId}, nenhuma ação de venda aprovada configurada.`);
        }

        return NextResponse.json({ success: true, message: 'Webhook recebido com sucesso' });

    } catch (error: any) {
        const errorMsg = `❌ [Webhook BuckPay] Erro fatal ao processar webhook: ${error.message}`;
        await notifyDiscord(errorMsg, requestBody);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
