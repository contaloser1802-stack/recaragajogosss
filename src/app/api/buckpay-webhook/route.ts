
'use server';

import { NextRequest, NextResponse } from 'next/server';
import getConfig from 'next/config';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';

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

        // Ação para pagamento APROVADO
        if (event === 'transaction.processed' && (data.status === 'paid' || data.status === 'approved')) {
            await notifyDiscord(`✅ [Webhook BuckPay] Evento APROVADO recebido. ID: ${transactionId}. Processando para Utmify.`);
            
            // Os dados completos já vêm no webhook de 'transaction.processed'
            const buckpayData = data;
            const tracking = buckpayData.tracking || {};
            const utm = tracking.utm || {}; // A documentação mostra um objeto 'utm' dentro de 'tracking'

            const utmifyPayload: UtmifyOrderPayload = {
                orderId: buckpayData.id,
                platform: 'RecargaJogo', 
                paymentMethod: 'pix',
                status: 'paid',
                createdAt: formatToUtmifyDate(new Date(buckpayData.created_at)),
                approvedDate: formatToUtmifyDate(new Date()), // Usar a data atual como data de aprovação
                refundedAt: null,
                customer: {
                    name: buckpayData.buyer.name,
                    email: buckpayData.buyer.email,
                    phone: buckpayData.buyer.phone?.replace(/\D/g, '') || null,
                    document: buckpayData.buyer.document?.replace(/\D/g, '') || null,
                    country: 'BR',
                    ip: buckpayData.buyer.ip || null,
                },
                // A documentação mostra 'offer', mas o create-payment envia 'items'. Vamos ser flexíveis.
                products: (buckpayData.items || [buckpayData.offer]).map((item: any) => ({
                    id: item.id || `prod_${Date.now()}`,
                    name: item.name || item.title,
                    planId: null,
                    planName: null,
                    quantity: item.quantity,
                    priceInCents: item.amount || item.discount_price,
                })),
                trackingParameters: {
                    src: tracking.src || null,
                    sck: tracking.sck || null,
                    utm_source: utm.source || null,
                    utm_campaign: utm.campaign || null,
                    utm_medium: utm.medium || null,
                    utm_content: utm.content || null,
                    utm_term: utm.term || null,
                },
                commission: {
                    totalPriceInCents: buckpayData.total_amount, // 'total_amount' do webhook
                    gatewayFeeInCents: buckpayData.total_amount - buckpayData.net_amount, // Calculado
                    userCommissionInCents: buckpayData.net_amount, // 'net_amount' do webhook
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
