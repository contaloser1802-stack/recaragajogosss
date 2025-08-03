import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';
import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';

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
        const transactionId = data?.id;

        if (!event || !transactionId || !data.status) {
            console.error('[buckpay-webhook] ❌ Payload inválido. Campos essenciais (event, data.id, data.status) não encontrados.');
            return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
        }

        if (event === 'transaction.processed' && (data.status === 'paid' || data.status === 'approved')) {
            console.log(`[buckpay-webhook] ✅ Iniciando processo para transação APROVADA ID: ${transactionId}`);

            // 1. Buscar os dados do pedido pendente no Supabase usando o transaction_id
            console.log(`[buckpay-webhook] 🔍 Buscando no Supabase por transaction_id: ${transactionId}`);
            const { data: transactionData, error: supabaseError } = await supabase
                .from('transactions')
                .select('utmify_payload')
                .eq('transaction_id', transactionId)
                .single();

            if (supabaseError || !transactionData) {
                console.error(`[buckpay-webhook] ❌ Erro ao buscar pedido no Supabase para transaction_id ${transactionId}:`, supabaseError?.message);
                // Responda 200 para a Buckpay não reenviar, mas logue o erro.
                return NextResponse.json({ success: true, message: 'Pedido não encontrado no banco de dados interno.' }, { status: 200 });
            }

            console.log(`[buckpay-webhook] ✅ Dados do pedido pendente encontrados no Supabase para ID: ${transactionId}`);
            
            // 2. Montar o payload para a Utmify com os dados recuperados, atualizando o status
            let utmifyPayload = transactionData.utmify_payload as UtmifyOrderPayload;
            
            utmifyPayload.status = 'paid';
            utmifyPayload.approvedDate = formatToUtmifyDate(new Date(data.paid_at || Date.now()));

            // 3. Atualizar o registro no Supabase com o novo status
            console.log(`[buckpay-webhook] 💾 Atualizando status no Supabase para 'paid' para o pedido '${transactionId}'...`);
            const { error: updateError } = await supabase
              .from('transactions')
              .update({ utmify_payload: utmifyPayload })
              .eq('transaction_id', transactionId);

            if (updateError) {
              console.error(`[buckpay-webhook] ❌ Erro ao atualizar o status no Supabase para o pedido ${transactionId}:`, updateError.message);
              // Considera-se não fatal para não impedir o envio para a Utmify, mas loga o erro.
            } else {
              console.log(`[buckpay-webhook] ✅ Status atualizado com sucesso no Supabase para o pedido ${transactionId}.`);
            }
            
            console.log(`[buckpay-webhook] 📦 Payload de APROVAÇÃO montado para enviar à Utmify para o pedido '${transactionId}':`, JSON.stringify(utmifyPayload, null, 2));
            
            // 4. Enviar para a Utmify
            await sendOrderToUtmify(utmifyPayload);
            console.log(`[buckpay-webhook] ✅ Dados do pedido ${transactionId} (pago) enviados para Utmify com sucesso.`);


        } else {
            console.log(`[buckpay-webhook] ℹ️ Evento '${event}' com status '${data.status}' recebido, mas nenhuma ação configurada para ele.`);
        }

        return NextResponse.json({ success: true, message: 'Webhook recebido com sucesso', transactionId: transactionId }, { status: 200 });

    } catch (error: any) {
        console.error('[buckpay-webhook] ❌ Erro fatal ao processar webhook:', error.message);
        
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
        
        // Responda 200 para a Buckpay para evitar retentativas em caso de erro interno.
        return NextResponse.json({ success: true, message: '