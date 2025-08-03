import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';
import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';

async function notifyDiscord(message: string, payload?: any) {
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!discordWebhookUrl) return;

    let content = message;
    if (payload) {
        content += `\n**Payload:**\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
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
        console.log('[buckpay-webhook] 🔄 Payload do webhook recebido:', JSON.stringify(requestBody, null, 2));

        const { event, data } = requestBody;
        const transactionId = data?.id;

        if (!event || !transactionId || !data.status) {
            const errorMsg = '[buckpay-webhook] ❌ Payload inválido. Campos essenciais (event, data.id, data.status) não encontrados.';
            console.error(errorMsg);
            await notifyDiscord(errorMsg, requestBody);
            return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
        }

        if (event === 'transaction.processed' && (data.status === 'paid' || data.status === 'approved')) {
            console.log(`[buckpay-webhook] ✅ Iniciando processo para transação APROVADA ID: ${transactionId}`);

            console.log(`[buckpay-webhook] 🔍 Buscando no Supabase por transaction_id: ${transactionId}`);
            const { data: transactionData, error: supabaseError } = await supabase
                .from('transactions')
                .select('utmify_payload')
                .eq('transaction_id', transactionId)
                .single();

            if (supabaseError || !transactionData) {
                const errorMsg = `[buckpay-webhook] ❌ Erro ao buscar pedido no Supabase para transaction_id ${transactionId}: ${supabaseError?.message || 'Pedido não encontrado.'}`;
                console.error(errorMsg);
                await notifyDiscord(errorMsg, requestBody);
                return NextResponse.json({ success: true, message: 'Pedido não encontrado no banco de dados interno.' }, { status: 200 });
            }

            console.log(`[buckpay-webhook] ✅ Dados do pedido pendente encontrados no Supabase para ID: ${transactionId}`);
            
            let utmifyPayload = transactionData.utmify_payload as UtmifyOrderPayload;
            
            if (utmifyPayload.status === 'paid') {
                console.log(`[buckpay-webhook] ℹ️ Pedido ${transactionId} já está como 'pago'. Ignorando notificação duplicada.`);
                return NextResponse.json({ success: true, message: 'Notificação duplicada ignorada.' }, { status: 200 });
            }
            
            utmifyPayload.status = 'paid';
            utmifyPayload.approvedDate = formatToUtmifyDate(new Date(data.paid_at || Date.now()));

            console.log(`[buckpay-webhook] 💾 Atualizando status no Supabase para 'paid' para o pedido '${transactionId}'...`);
            const { error: updateError } = await supabase
              .from('transactions')
              .update({ utmify_payload: utmifyPayload })
              .eq('transaction_id', transactionId);

            if (updateError) {
              const errorMsg = `[buckpay-webhook] ❌ Erro ao atualizar o status no Supabase para o pedido ${transactionId}: ${updateError.message}`;
              console.error(errorMsg);
              await notifyDiscord(errorMsg, { transactionId, utmifyPayload });
              // Continue mesmo se a atualização falhar para garantir que a Utmify seja notificada
            } else {
              console.log(`[buckpay-webhook] ✅ Status atualizado com sucesso no Supabase para o pedido ${transactionId}.`);
            }
            
            console.log(`[buckpay-webhook] 📦 Payload de APROVAÇÃO montado para enviar à Utmify para o pedido '${transactionId}':`, JSON.stringify(utmifyPayload, null, 2));
            
            await sendOrderToUtmify(utmifyPayload);
            console.log(`[buckpay-webhook] ✅ Dados do pedido ${transactionId} (pago) enviados para Utmify com sucesso.`);
            await notifyDiscord(`✅ Venda Aprovada e Registrada! Transação ID: ${transactionId}`, utmifyPayload);

        } else {
            console.log(`[buckpay-webhook] ℹ️ Evento '${event}' com status '${data.status}' recebido, mas nenhuma ação configurada para ele.`);
        }

        return NextResponse.json({ success: true, message: 'Webhook recebido com sucesso', transactionId: transactionId }, { status: 200 });

    } catch (error: any) {
        const errorMsg = `[buckpay-webhook] ❌ Erro fatal ao processar webhook: ${error.message}`;
        console.error(errorMsg);
        await notifyDiscord(errorMsg, requestBody);
        
        // Retornamos 200 para a Buckpay para evitar retries desnecessários, pois já logamos o erro.
        return NextResponse.json({ success: true, message: 'Erro interno ao processar, notificação registrada.' }, { status: 200 });
    }
}
