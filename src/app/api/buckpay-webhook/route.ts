import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload, UtmifyProduct, UtmifyTrackingParameters, UtmifyCustomer } from '@/interfaces/utmify';
import axios from 'axios';

// Função para enviar logs para o Discord
async function notifyDiscord(message: string, payload?: any) {
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!discordWebhookUrl) {
        console.error("DISCORD_WEBHOOK_URL não está configurada.");
        return;
    }

    let content = message;
    if (payload) {
        // Limita o tamanho do payload no log para evitar exceder o limite do Discord
        const payloadString = JSON.stringify(payload, null, 2);
        const truncatedPayload = payloadString.length > 1800 ? payloadString.substring(0, 1800) + '...' : payloadString;
        content += `\n**Payload:**\n\`\`\`json\n${truncatedPayload}\n\`\`\``;
    }

    try {
        await axios.post(discordWebhookUrl, { content });
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

        // Validação básica do payload
        if (!event || !data || !data.id || !data.status) {
            const errorMsg = '❌ [Webhook BuckPay] Payload inválido. Campos essenciais (event, data, data.id, data.status) não encontrados.';
            await notifyDiscord(errorMsg, requestBody);
            return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
        }
        
        const transactionId = data.id;

        // Processa apenas transações pagas/aprovadas
        if (event === 'transaction.processed' && (data.status === 'paid' || data.status === 'approved')) {
            await notifyDiscord(`✅ [Webhook BuckPay] Iniciando processo para transação APROVADA ID: ${transactionId}`);

            // Monta o payload para a Utmify diretamente com os dados do webhook
            // Nota: Alguns campos podem não vir no webhook de confirmação, então usamos valores padrão ou "N/A"
            
            const tracking: UtmifyTrackingParameters = {
                src: data.tracking?.src || null,
                sck: data.tracking?.sck || null,
                utm_source: data.tracking?.utm_source || null,
                utm_campaign: data.tracking?.utm_campaign || null,
                utm_medium: data.tracking?.utm_medium || null,
                utm_content: data.tracking?.utm_content || null,
                utm_term: data.tracking?.utm_term || null,
            };

            const customer: UtmifyCustomer = {
                name: data.buyer?.name || 'N/A',
                email: data.buyer?.email || 'N/A',
                phone: data.buyer?.phone?.replace(/\D/g, '') || null,
                document: data.buyer?.document?.replace(/\D/g, '') || null,
                country: 'BR', // Assumindo Brasil
                ip: data.buyer?.ip || null,
            };

            const products: UtmifyProduct[] = (data.items || []).map((item: any) => ({
                id: item.id || `prod_${Date.now()}`,
                name: item.name || 'Produto',
                planId: null,
                planName: null,
                quantity: item.quantity || 1,
                priceInCents: item.amount || 0,
            }));

            // Se não houver produtos no webhook, cria um genérico com o valor total
            if (products.length === 0) {
                products.push({
                    id: `prod_${transactionId}`,
                    name: 'Produto Principal',
                    planId: null,
                    planName: null,
                    quantity: 1,
                    priceInCents: data.total_amount || 0,
                });
            }

            const utmifyPayload: UtmifyOrderPayload = {
                orderId: transactionId,
                platform: 'RecargaJogo',
                paymentMethod: 'pix',
                status: 'paid', // Status final é 'paid'
                createdAt: formatToUtmifyDate(new Date(data.created_at || Date.now())),
                approvedDate: formatToUtmifyDate(new Date(data.paid_at || Date.now())),
                refundedAt: null,
                customer,
                products,
                trackingParameters: tracking,
                commission: {
                    totalPriceInCents: data.total_amount || 0,
                    gatewayFeeInCents: (data.total_amount || 0) - (data.net_amount || 0), // Taxa do gateway
                    userCommissionInCents: data.net_amount || 0, // Comissão do usuário
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

        // Retorna sucesso para a BuckPay para que não tentem reenviar o webhook.
        return NextResponse.json({ success: true, message: 'Webhook recebido com sucesso', transactionId: transactionId }, { status: 200 });

    } catch (error: any) {
        const errorMsg = `❌ [Webhook BuckPay] Erro fatal ao processar webhook: ${error.message}`;
        await notifyDiscord(errorMsg, requestBody);
        
        // Retornamos 200 para a Buckpay para evitar retries desnecessários, pois já logamos o erro.
        return NextResponse.json({ success: true, message: 'Erro interno ao processar, notificação registrada.' }, { status: 200 });
    }
}
