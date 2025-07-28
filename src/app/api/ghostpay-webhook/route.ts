
// src/app/api/ghostpay-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload, UtmifyOrderStatus, UtmifyPaymentMethod } from '@/interfaces/utmify';

// Lida com as requisições POST do webhook da GhostPay
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    console.log('[ghostpay-webhook] Payload recebido:', JSON.stringify(event, null, 2));

    // Validação básica do payload
    if (!event.id || !event.status) {
      console.error('[ghostpay-webhook] Payload inválido. Campos "id" ou "status" não encontrados.');
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const paymentStatus = event.status.toUpperCase();

    // Processa apenas pagamentos aprovados (PAID ou APPROVED)
    if (paymentStatus === 'APPROVED' || paymentStatus === 'PAID') {
      console.log(`[ghostpay-webhook] Pagamento aprovado (ID: ${event.id}). Iniciando envio para Utmify.`);

      // Monta o payload para a Utmify a partir dos dados do webhook da GhostPay
      const utmifyPayload: UtmifyOrderPayload = {
        orderId: event.id,
        platform: 'RecargaJogo', // Deve ser o mesmo nome de plataforma da criação
        paymentMethod: 'pix', // Mapear se houver outros métodos
        status: 'paid', // Status para a Utmify
        createdAt: formatToUtmifyDate(new Date(event.createdAt || Date.now())),
        approvedDate: formatToUtmifyDate(new Date(event.paidAt || Date.now())),
        refundedAt: null,
        customer: {
          name: event.customer?.name || 'N/A',
          email: event.customer?.email || 'N/A',
          phone: event.customer?.phone?.replace(/\D/g, '') || null,
          document: event.customer?.cpf?.replace(/\D/g, '') || null,
          country: 'BR',
          ip: event.customer?.ipAddress || null,
        },
        products: event.items?.map((item: any) => ({
          id: item.id || `prod_${Date.now()}`,
          name: item.title || 'Produto',
          planId: null,
          planName: null,
          quantity: item.quantity || 1,
          priceInCents: item.unitPrice || 0,
        })) || [],
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
          totalPriceInCents: event.amount || 0,
          // A GhostPay não detalha as taxas no webhook padrão, então definimos como 0
          // e o valor líquido como o total. Ajuste se você tiver esses dados.
          gatewayFeeInCents: 0,
          userCommissionInCents: event.amount || 0,
          currency: 'BRL',
        },
        isTest: false, // Mude para true se estiver em ambiente de teste
      };

      try {
        // Envia os dados para a Utmify
        await sendOrderToUtmify(utmifyPayload);
        console.log(`[ghostpay-webhook] Dados do pedido ${event.id} enviados para Utmify com sucesso.`);
      } catch (utmifyError: any) {
        // Loga o erro, mas não retorna erro para a GhostPay, pois o pagamento foi recebido.
        // O importante é registrar que o envio para a Utmify falhou para análise posterior.
        console.error(`[ghostpay-webhook] Erro ao enviar dados para Utmify para o pedido ${event.id}:`, utmifyError.message);
      }
    } else {
      console.log(`[ghostpay-webhook] Status do pagamento é '${paymentStatus}'. Nenhuma ação necessária.`);
    }

    // Retorna uma resposta de sucesso para a GhostPay para confirmar o recebimento do webhook
    return NextResponse.json({ success: true, message: 'Webhook recebido com sucesso' }, { status: 200 });

  } catch (error: any) {
    console.error('[ghostpay-webhook] Erro ao processar webhook:', error.message);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
