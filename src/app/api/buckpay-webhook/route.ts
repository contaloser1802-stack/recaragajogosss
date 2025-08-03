import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { getTransactionById } from '@/lib/buckpayService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';
import axios from 'axios';

async function handleApprovedTransaction(transactionId: string) {
    console.log(`[buckpay-webhook] Iniciando processo para transação APROVADA ID: ${transactionId}`);

    // 1. Buscar os detalhes completos da transação na API da Buckpay
    const transactionDetails = await getTransactionById(transactionId);
    
    if (!transactionDetails) {
        throw new Error(`[buckpay-webhook] Falha ao obter detalhes da transação ${transactionId} da API da Buckpay.`);
    }

    console.log(`[buckpay-webhook] Detalhes completos da transação ${transactionId} obtidos da Buckpay.`);

    const { data } = transactionDetails;

    // 2. Montar o payload para a Utmify com os dados completos
    const utmifyPayload: UtmifyOrderPayload = {
        orderId: data.id,
        platform: 'RecargaJogo',
        paymentMethod: 'pix',
        status: 'paid', // Status final de venda paga
        createdAt: formatToUtmifyDate(new Date(data.created_at)),
        approvedDate: formatToUtmifyDate(new Date(data.paid_at || Date.now())),
        refundedAt: null,
        customer: {
            name: data.buyer.name,
            email: data.buyer.email,
            phone: data.buyer.phone.replace(/^55/, ''),
            document: data.buyer.document,
            country: 'BR', 
            ip: data.buyer.ip,
        },
        products: data.items.map((item: any) => ({
            id: item.id || `prod_${Date.now()}`,
            name: item.name,
            planId: null,
            planName: null,
            quantity: item.quantity,
            priceInCents: item.amount,
        })),
        trackingParameters: {
            src: data.tracking?.src || null,
            sck: data.tracking?.sck || null,
            utm_source: data.tracking?.utm_source || null,
            utm_campaign: data.tracking?.utm_campaign || null,
            utm_medium: data.tracking?.utm_medium || null,
            utm_content: data.tracking?.utm_content || null,
            utm_term: data.tracking?.utm_term || null,
        },
        commission: {
            totalPriceInCents: data.total_amount,
            gatewayFeeInCents: 0,
            userCommissionInCents: data.total_amount,
            currency: 'BRL',
        },
        isTest: false,
    };

    console.log(`[buckpay-webhook] 📦 Payload de APROVAÇÃO montado para enviar à Utmify para o pedido '${transactionId}':`, JSON.stringify(utmifyPayload, null, 2));

    // 3. Enviar para a Utmify
    await sendOrderToUtmify(utmifyPayload);
    console.log(`[buckpay-webhook] ✅ Dados do pedido ${transactionId} (pago) enviados para Utmify com sucesso.`);
}

export async function POST(request: NextRequest) {
    const webhookToken = request.headers.get('authorization');
    const secretToken = process.env.BUCKPAY_WEBHOOK_TOKEN;
    let requestBody;

    if (!secretToken) {
        console.error('[buckpay-webhook] ❌ BUCKPAY_WEBHOOK_TOKEN não está configurado no servidor.');
        return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
    }

    if (webhookToken !== secretToken) {
        console.warn(`[buckpay-webhook] Chamada de webhook não autorizada bloqueada.`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        requestBody = await request.json();
        console.log('[buckpay-webhook] 🔄 Payload do webhook recebido:', JSON.stringify(requestBody, null, 2));

        const { event, data } = requestBody;

        if (!event || !data || !data.id || !data.status) {
            console.error('[buckpay-webhook] ❌ Payload inválido. Campos essenciais não encontrados.');
            return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
        }

        // Ação principal: Apenas quando a transação for processada (paga)
        if (event === 'transaction.processed' && (data.status === 'paid' || data.status === 'approved')) {
            await handleApprovedTransaction(data.id);
        } else {
            console.log(`[buckpay-webhook] ℹ️ Evento '${event}' com status '${data.status}' recebido, mas nenhuma ação configurada para ele.`);
        }

        return NextResponse.json({ success: true, message: 'Webhook recebido com sucesso' }, { status: 200 });

    } catch (error: any) {
        console.error('[buckpay-webhook] ❌ Erro fatal ao processar webhook:', error.message);

        // Tenta logar o erro no Discord
        const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (discordWebhookUrl) {
            try {
                await axios.post(discordWebhookUrl, {
                    content: `🚨 **Erro no Webhook BuckPay** 🚨\n**Erro:** ${error.message}\n**Payload Recebido:**\n\`\`\`json\n${JSON.stringify(requestBody || 'Falha ao ler o corpo da requisição', null, 2)}\n\`\`\``
                });
            } catch (discordError) {
                console.error("Falha ao enviar log de erro para o Discord:", discordError);
            }
        }

        // Não retorna um erro 500 para a BuckPay para evitar retentativas infinitas em caso de erro de lógica
        return NextResponse.json({ success: true, message: 'Erro processado internamente, não haverá retentativa.' }, { status: 200 });
    }
}
