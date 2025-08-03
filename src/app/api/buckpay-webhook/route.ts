'use server';

import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload, UtmifyProduct, UtmifyTrackingParameters, UtmifyCustomer } from '@/interfaces/utmify';
import { getTransactionById } from '@/lib/buckpayService';

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

export async function POST(request: NextRequest) {
    let requestBody;
    try {
        requestBody = await request.json();
        await notifyDiscord('🔄 [Webhook BuckPay] Payload recebido:', requestBody);

        const { event, data } = requestBody;

        if (!event || !data || !data.id || !data.status) {
            const errorMsg = '❌ [Webhook BuckPay] Payload inválido. Campos essenciais (event, data, data.id, data.status) não encontrados.';
            await notifyDiscord(errorMsg, requestBody);
            return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
        }
        
        const transactionId = data.id;

        if (event === 'transaction.processed' && (data.status === 'paid' || data.status === 'approved')) {
            await notifyDiscord(`✅ [Webhook BuckPay] Iniciando processo para transação APROVADA ID: ${transactionId}`);

            // Busca os detalhes completos da transação na API da Buckpay
            await notifyDiscord(`🔎 [Webhook BuckPay] Buscando detalhes completos da transação ${transactionId} na API...`);
            const transactionDetailsResponse = await getTransactionById(transactionId);
            
            if (!transactionDetailsResponse || !transactionDetailsResponse.data) {
                const errorMsg = `❌ [Webhook BuckPay] Não foi possível obter os detalhes da transação ${transactionId} da API da Buckpay.`;
                await notifyDiscord(errorMsg, { transactionId });
                return NextResponse.json({ error: errorMsg }, { status: 500 });
            }

            const details = transactionDetailsResponse.data;
            await notifyDiscord(`📄 [Webhook BuckPay] Detalhes da transação ${transactionId} obtidos:`, details);

            const tracking: UtmifyTrackingParameters = {
                src: details.tracking?.src || null,
                sck: details.tracking?.sck || null,
                utm_source: details.tracking?.utm_source || null,
                utm_campaign: details.tracking?.utm_campaign || null,
                utm_medium: details.tracking?.utm_medium || null,
                utm_content: details.tracking?.utm_content || null,
                utm_term: details.tracking?.utm_term || null,
            };

            const customer: UtmifyCustomer = {
                name: details.buyer?.name || 'N/A',
                email: details.buyer?.email || 'N/A',
                phone: details.buyer?.phone?.replace(/\D/g, '') || null,
                document: details.buyer?.document?.replace(/\D/g, '') || null,
                country: 'BR',
                ip: details.buyer?.ip || null,
            };

            const products: UtmifyProduct[] = (details.items || []).map((item: any) => ({
                id: item.id || `prod_${Date.now()}`,
                name: item.name || 'Produto',
                planId: null,
                planName: null,
                quantity: item.quantity || 1,
                priceInCents: item.amount || 0,
            }));

            if (products.length === 0 && details.total_amount) {
                products.push({
                    id: `prod_${transactionId}`,
                    name: 'Produto Principal',
                    planId: null,
                    planName: null,
                    quantity: 1,
                    priceInCents: details.total_amount,
                });
            }

            const utmifyPayload: UtmifyOrderPayload = {
                orderId: transactionId,
                platform: 'RecargaJogo',
                paymentMethod: 'pix',
                status: 'paid',
                createdAt: formatToUtmifyDate(new Date(details.created_at || Date.now())),
                approvedDate: formatToUtmifyDate(new Date(details.paid_at || Date.now())),
                refundedAt: null,
                customer,
                products,
                trackingParameters: tracking,
                commission: {
                    totalPriceInCents: details.total_amount || 0,
                    gatewayFeeInCents: (details.total_amount || 0) - (details.net_amount || 0),
                    userCommissionInCents: details.net_amount || 0,
                    currency: 'BRL',
                },
                isTest: false,
            };
            
            await notifyDiscord(`📦 [Webhook BuckPay] Payload de APROVAÇÃO montado para enviar à Utmify para o pedido '${transactionId}':`, utmifyPayload);
            
            try {
                await sendOrderToUtmify(utmifyPayload);
                await notifyDiscord(`✅ [Webhook BuckPay] Dados do pedido ${transactionId} (pago) enviados para Utmify com sucesso.`);
            } catch (utmifyError: any) {
                await notifyDiscord(`❌ [Webhook BuckPay] Erro ao enviar dados APROVADOS para Utmify para o pedido ${transactionId}: ${utmifyError.message}`, utmifyPayload);
            }

        } else {
            await notifyDiscord(`ℹ️ [Webhook BuckPay] Evento '${event}' com status '${data.status}' recebido para ID ${transactionId}, nenhuma ação de aprovação configurada.`);
        }

        return NextResponse.json({ success: true, message: 'Webhook recebido com sucesso', transactionId: transactionId }, { status: 200 });

    } catch (error: any) {
        const errorMsg = `❌ [Webhook BuckPay] Erro fatal ao processar webhook: ${error.message}`;
        await notifyDiscord(errorMsg, requestBody);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
