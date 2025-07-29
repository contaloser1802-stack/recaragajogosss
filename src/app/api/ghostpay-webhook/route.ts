import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';

export async function POST(request: NextRequest) {
  try {
    const ghostpayToken = request.headers.get('authorization');
    const secretKey = process.env.GHOSTPAY_SECRET_KEY;

    if (!secretKey) {
      console.error('[ghostpay-webhook] ❌ GHOSTPAY_SECRET_KEY não está configurado no servidor.');
      return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
    }

    if (ghostpayToken !== secretKey) {
      console.warn(`[ghostpay-webhook]  Chamada de webhook não autorizada bloqueada.`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await request.json();
    console.log('[ghostpay-webhook] 🔄 Payload do webhook recebido:', JSON.stringify(event, null, 2));

    if (!event.id || !event.status || !event.customer || !event.items) {
      console.error('[ghostpay-webhook] ❌ Payload inválido. Campos essenciais como id, status, customer ou items não encontrados.');
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const paymentStatus = event.status.toUpperCase();
    const totalAmountInCents = event.amount || 0;

    if (paymentStatus === 'APPROVED' || paymentStatus === 'PAID') {
      console.log(`[ghostpay-webhook] ✅ Pagamento APROVADO (ID: ${event.id}). Iniciando envio para Utmify.`);

      const utmifyPayload: UtmifyOrderPayload = {
        orderId: event.id,
        platform: 'RecargaJogo',
        paymentMethod: 'pix',
        status: 'paid', // Usar 'paid' para venda aprovada na Utmify
        createdAt: formatToUtmifyDate(new Date(event.createdAt || Date.now())),
        approvedDate: formatToUtmifyDate(new Date(event.paidAt || Date.now())),
        refundedAt: null,
        customer: {
          name: event.customer.name || 'N/A',
          email: event.customer.email || 'N/A',
          phone: event.customer.phone?.replace(/\D/g, '') || null,
          document: event.customer.cpf?.replace(/\D/g, '') || null,
          country: 'BR',
          ip: event.customer.ipAddress || null,
        },
        products: event.items.map((item: any) => ({
          id: item.id || `prod_${Date.now()}`,
          name: item.title || 'Produto',
          planId: null,
          planName: null,
          quantity: item.quantity || 1,
          priceInCents: item.unitPrice || 0, // GhostPay já envia em centavos
        })),
        trackingParameters: {
            src: event.utmQuery?.utm_source || null,
            sck: event.utmQuery?.sck || null,
            utm_source: event.utmQuery?.utm_source || null,
            utm_campaign: event.utmQuery?.utm_campaign || null,
            utm_medium: event.utmQuery?.utm_medium || null,
            utm_content: event.utmQuery?.utm_content || null,
            utm_term: event.utmQuery?.utm_term || null,
        },
        commission: {
          totalPriceInCents: totalAmountInCents,
          gatewayFeeInCents: 0, 
          userCommissionInCents: totalAmountInCents, 
          currency: 'BRL',
        },
        isTest: false,
      };

      console.log(`[ghostpay-webhook] 📦 Payload montado para enviar à Utmify:`, JSON.stringify(utmifyPayload, null, 2));

      try {
        await sendOrderToUtmify(utmifyPayload);
        console.log(`[ghostpay-webhook] ✅ Dados do pedido APROVADO ${event.id} enviados para Utmify com sucesso.`);
      } catch (utmifyError: any) {
        console.error(`[ghostpay-webhook] ❌ Erro ao enviar dados APROVADOS para Utmify para o pedido ${event.id}:`, utmifyError.message);
      }
    } else {
      console.log(`[ghostpay-webhook] ℹ️ Status do pagamento é '${paymentStatus}'. Nenhuma ação necessária.`);
    }

    return NextResponse.json({ success: true, message: 'Webhook recebido com sucesso' }, { status: 200 });

  } catch (error: any) {
    console.error('[ghostpay-webhook] ❌ Erro fatal ao processar webhook:', error.message);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
