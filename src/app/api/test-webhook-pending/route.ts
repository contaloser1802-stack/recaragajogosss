// src/app/api/test-webhook-pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload, UtmifyPaymentMethod, UtmifyOrderStatus } from '@/interfaces/utmify';

// Esta é uma rota de TESTE para simular o envio de um pedido PENDENTE para a Utmify.
// Agora ela gera 29 notificações de uma vez.
// Para usar, acesse a URL /api/test-webhook-pending no seu navegador.

export async function GET(request: NextRequest) {
  try {
    const promises = [];
    const createdOrderIds = [];

    for (let i = 0; i < 29; i++) {
      // 1. Crie um payload de exemplo que imita o que seria enviado na criação de um pagamento.
      // Use um ID de pedido único para cada teste para vê-lo na Utmify.
      const testOrderId = `TEST-PENDING-${Date.now()}-${i}`;
      createdOrderIds.push(testOrderId);
      
      const amountInCents = 1999; // Exemplo: R$ 19,99

      // Obtém o IP do cliente da requisição (essencial para a Utmify)
      const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';

      const testPayload: UtmifyOrderPayload = {
        orderId: testOrderId,
        platform: 'RecargaJogo',
        paymentMethod: 'pix' as UtmifyPaymentMethod,
        status: 'waiting_payment' as UtmifyOrderStatus,
        createdAt: formatToUtmifyDate(new Date()),
        approvedDate: null,
        refundedAt: null,
        customer: {
          name: 'Cliente Teste Pendente',
          email: 'pendente@example.com',
          phone: '11988887777',
          document: '98765432100',
          country: 'BR',
          ip: ip,
        },
        products: [
          {
            id: 'prod-teste-456',
            name: 'Produto de Teste Pendente',
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: amountInCents,
          },
        ],
        trackingParameters: {
          src: 'teste-pending-source',
          sck: 'teste-pending-sck',
          utm_source: 'teste-pending-source',
          utm_campaign: 'teste-pending-campaign',
          utm_medium: 'teste-pending-medium',
          utm_content: null,
          utm_term: null,
        },
        commission: {
          totalPriceInCents: amountInCents,
          gatewayFeeInCents: 0,
          userCommissionInCents: amountInCents,
          currency: 'BRL',
        },
        isTest: false,
      };

      console.log(`[test-webhook-pending] [${i+1}/29] Simulando envio para a Utmify com o payload:`, JSON.stringify(testPayload, null, 2));

      // 2. Adiciona a promessa de envio à lista.
      promises.push(sendOrderToUtmify(testPayload));
    }

    // 3. Executa todas as promessas em paralelo.
    const results = await Promise.allSettled(promises);

    const successfulInvocations = results.filter(r => r.status === 'fulfilled').length;
    const failedInvocations = results.filter(r => r.status === 'rejected');
    
    console.log(`[test-webhook-pending] Simulação concluída. ${successfulInvocations} sucessos, ${failedInvocations.length} falhas.`);
    if(failedInvocations.length > 0) {
        console.error('[test-webhook-pending] Detalhes das falhas:', failedInvocations);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Simulação de webhook PENDENTE executada. ${successfulInvocations} de 29 pedidos enviados para a Utmify.`,
        createdOrderIds: createdOrderIds,
        results: results
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[test-webhook-pending] Erro fatal na simulação:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro fatal ao simular o webhook pendente.',
        error: error.message
      },
      { status: 500 }
    );
  }
}
