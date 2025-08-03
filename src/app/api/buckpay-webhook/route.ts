import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload, UtmifyProduct } from '@/interfaces/utmify';
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

    const body = await request.json();
    console.log('[buckpay-webhook] 🔄 Payload do webhook recebido:', JSON.stringify(body, null, 2));

    const { event, data } = body;

    if (!event || !data || !data.id || !data.status || !data.buyer) {
      console.error('[buckpay-webhook] ❌ Payload inválido. Campos essenciais não encontrados.');
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    // Ações baseadas no tipo de evento
    if (event === 'transaction.created' || event === 'transaction.processed') {
      
      const utmifyStatus = event === 'transaction.created' ? 'waiting_payment' : 'paid';
      const approvedDate = event === 'transaction.processed' ? formatToUtmifyDate(new Date()) : null;

      const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
      const geoData = await getGeoData(ip);
      
       // O webhook da Buckpay não detalha o preço dos itens, apenas o valor total.
      // Para garantir que a venda seja registrada na Utmify, criamos um produto "genérico"
      // com o valor total da transação.
      const products: UtmifyProduct[] = [
        {
          id: data.id, // Usamos o ID da transação como ID do produto
          name: 'Recarga Jogo', // Nome genérico
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: data.total_amount || 0,
        },
      ];

      if (!data.total_amount || data.total_amount === 0) {
        console.error('[buckpay-webhook] ❌ Valor total da transação (total_amount) não encontrado ou zerado. Não é possível enviar para Utmify.');
        return NextResponse.json({ success: true, message: 'Webhook recebido, mas sem valor para processar.' }, { status: 200 });
      }

      const utmifyPayload: UtmifyOrderPayload = {
        orderId: data.id,
        platform: 'RecargaJogo', // Pode ser dinâmico se necessário
        paymentMethod: 'pix',
        status: utmifyStatus,
        createdAt: formatToUtmifyDate(new Date(data.created_at || Date.now())),
        approvedDate: approvedDate,
        refundedAt: null,
        customer: {
          name: data.buyer.name || 'N/A',
          email: data.buyer.email || 'N/A',
          phone: data.buyer.phone?.replace(/^55/, '') || null,
          document: data.buyer.document || null,
          country: geoData.countryCode,
          ip: ip,
        },
        products: products,
        trackingParameters: {
            src: data.tracking?.src || null,
            sck: data.tracking?.sck || null,
            utm_source: data.tracking?.utm?.source || null,
            utm_campaign: data.tracking?.utm?.campaign || null,
            utm_medium: data.tracking?.utm?.medium || null,
            utm_content: data.tracking?.utm?.content || null,
            utm_term: data.tracking?.utm?.term || null,
        },
        commission: {
          totalPriceInCents: data.total_amount || 0,
          gatewayFeeInCents: 0, 
          userCommissionInCents: data.total_amount || 0,
          currency: 'BRL',
        },
        isTest: false,
      };

      console.log(`[buckpay-webhook] 📦 Payload montado para enviar à Utmify para o evento '${event}':`, JSON.stringify(utmifyPayload, null, 2));

      try {
        await sendOrderToUtmify(utmifyPayload);
        console.log(`[buckpay-webhook] ✅ Dados do pedido ${data.id} (${utmifyStatus}) enviados para Utmify com sucesso.`);
      } catch (utmifyError: any) {
        console.error(`[buckpay-webhook] ❌ Erro ao enviar dados (${utmifyStatus}) para Utmify para o pedido ${data.id}:`, utmifyError.message);
        // Não retornar erro aqui para que a BuckPay não tente reenviar o webhook indefinidamente
      }

    } else {
      console.log(`[buckpay-webhook] ℹ️ Evento '${event}' recebido, mas nenhuma ação configurada para ele.`);
    }

    return NextResponse.json({ success: true, message: 'Webhook recebido com sucesso' }, { status: 200 });

  } catch (error: any) {
    console.error('[buckpay-webhook] ❌ Erro fatal ao processar webhook:', error.message);
    // Log para Discord
    const discordWebhookUrl = 'https://ptb.discord.com/api/webhooks/1389963074710147142/6wC4YLCqzXltT1SFHOd5aPTfVxOldcmk33_OK7oyaMHSfRaxg7ZMbjlmcsqCd2PTNCfh';
    try {
        const requestBody = await request.json().catch(() => 'Falha ao ler o corpo da requisição');
        await axios.post(discordWebhookUrl, {
            content: `🚨 **Erro no Webhook BuckPay** 🚨\n**Erro:** ${error.message}\n**Payload Recebido:**\n\`\`\`json\n${JSON.stringify(requestBody, null, 2)}\n\`\`\``
        });
    } catch(discordError) {
        console.error("Falha ao enviar log de erro para o Discord:", discordError);
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
