'use server';

import { NextRequest, NextResponse } from 'next/server';
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
            await notifyDiscord(`✅ [Webhook BuckPay] Transação APROVADA ID: ${transactionId}. Nenhuma ação adicional configurada.`);
            // Lógica para enviar para Utmify foi removida.
            // Você pode adicionar outras ações aqui se necessário, como liberar o produto para o cliente.

        } else {
            await notifyDiscord(`ℹ️ [Webhook BuckPay] Evento '${event}' com status '${data.status}' recebido para ID ${transactionId}, nenhuma ação configurada.`);
        }

        return NextResponse.json({ success: true, message: 'Webhook recebido com sucesso', transactionId: transactionId }, { status: 200 });

    } catch (error: any) {
        const errorMsg = `❌ [Webhook BuckPay] Erro fatal ao processar webhook: ${error.message}`;
        await notifyDiscord(errorMsg, requestBody);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}