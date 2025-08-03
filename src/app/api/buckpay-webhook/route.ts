import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { getPendingOrder, removePendingOrder } from '@/lib/pendingOrders';
import axios from 'axios';

// Função para obter dados de geolocalização do IP
async function getGeoData(ip: string) {
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { countryCode: 'BR' }; // Retorna 'BR' como padrão para testes locais
  }
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode`);
    return {
      countryCode: response.data.countryCode || 'BR',
    };
  } catch (error) {
    console.error(`[GeoData] Falha ao obter dados de geolocalização para o IP ${ip}:`, error);
    return { countryCode: 'BR' }; // Retorna 'BR' em caso de erro
  }
}

export async function POST(request: NextRequest) {
  let requestBody;
  try {
    const webhookToken = request.headers.get('authorization');
    const secretToken = process.env.BUCKPAY_WEBHOOK_TOKEN;

    if (!secretToken) {
      console.error('[buckpay-webhook] ❌ BUCKPAY_WEBHOOK_TOKEN não está configurado no servidor.');
      return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
    }

    if (webhookToken !== secretToken) {
      console.warn(`[buckpay-webhook] Chamada de webhook não autorizada bloqueada.`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    requestBody = await request.json();
    console.log('[buckpay-webhook] 🔄 Payload do webhook recebido:', JSON.stringify(requestBody, null, 2));

    const { event, data } = requestBody;

    if (!event || !data || !data.id || !data.status || !data.buyer) {
      console.error('[buckpay-webhook] ❌ Payload inválido. Campos essenciais não encontrados.');
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    // Ação principal: Apenas quando a transação for processada (paga)
    if (event === 'transaction.processed' && (data.status === 'paid' || data.status === 'approved')) {
      
      const transactionId = data.id;

      // 1. Buscar o payload original salvo
      const originalPayload = await getPendingOrder(transactionId);

      if (!originalPayload) {
          console.error(`[buckpay-webhook] ❌ Pedido pendente com ID ${transactionId} não encontrado. Não é possível enviar a aprovação para a Utmify.`);
          // Retornamos sucesso para a Buckpay não reenviar, mas o erro está logado.
          return NextResponse.json({ success: true, message: `Pedido pendente ${transactionId} não encontrado` }, { status: 200 });
      }

      // 2. Atualizar o payload com o status 'paid' e a data de aprovação
      const approvedPayload = {
          ...originalPayload,
          status: 'paid' as const,
          approvedDate: formatToUtmifyDate(new Date(data.paid_at || Date.now())),
      };
      
      console.log(`[buckpay-webhook] 📦 Payload de APROVAÇÃO montado para enviar à Utmify para o pedido '${transactionId}':`, JSON.stringify(approvedPayload, null, 2));

      try {
        await sendOrderToUtmify(approvedPayload);
        console.log(`[buckpay-webhook] ✅ Dados do pedido ${transactionId} (pago) enviados para Utmify com sucesso.`);
        // 3. Remover o pedido da lista de pendentes após o sucesso
        await removePendingOrder(transactionId);
        console.log(`[buckpay-webhook] 🗑️ Pedido pendente ${transactionId} removido.`);
      } catch (utmifyError: any) {
        console.error(`[buckpay-webhook] ❌ Erro ao enviar dados (pago) para Utmify para o pedido ${transactionId}:`, utmifyError.message);
        // Não retornar erro aqui para que a BuckPay não tente reenviar o webhook indefinidamente
      }

    } else {
      console.log(`[buckpay-webhook] ℹ️ Evento '${event}' com status '${data.status}' recebido, mas nenhuma ação configurada para ele.`);
    }

    return NextResponse.json({ success: true, message: 'Webhook recebido com sucesso' }, { status: 200 });

  } catch (error: any) {
    console.error('[buckpay-webhook] ❌ Erro fatal ao processar webhook:', error.message);
    
    if (!requestBody) {
        try {
            const rawText = await request.text();
            requestBody = JSON.parse(rawText);
        } catch (parseError) {
            requestBody = 'Falha ao ler ou parsear o corpo da requisição.';
        }
    }

    const discordWebhookUrl = 'https://ptb.discord.com/api/webhooks/1389963074710147142/6wC4YLCqzXltT1SFHOd5aPTfVxOldcmk33_OK7oyaMHSfRaxg7ZMbjlmcsqCd2PTNCfh';
    try {
        await axios.post(discordWebhookUrl, {
            content: `🚨 **Erro no Webhook BuckPay** 🚨\n**Erro:** ${error.message}\n**Payload Recebido:**\n\`\`\`json\n${JSON.stringify(requestBody, null, 2)}\n\`\`\``
        });
    } catch(discordError) {
        console.error("Falha ao enviar log de erro para o Discord:", discordError);
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}