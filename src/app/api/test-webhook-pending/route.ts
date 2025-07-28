// src/app/api/test-webhook-pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload, UtmifyPaymentMethod, UtmifyOrderStatus } from '@/interfaces/utmify';

// Esta é uma rota de TESTE para simular o envio de um pedido PENDENTE para a Utmify.
// Você pode usá-la para verificar se as vendas geradas (antes do pagamento) estão sendo enviadas corretamente.
// Para usar, acesse a URL /api/test-webhook-pending no seu navegador.
// Lembre-se de remover este arquivo quando não precisar mais dele.

export async function GET(request: NextRequest) {
  try {
    // 1. Crie um payload de exemplo que imita o que seria enviado na criação de um pagamento.
    // Use um ID de pedido único para cada teste para vê-lo na Utmify.
    const testOrderId = `TEST-PENDING-${Date.now()}`;
    const amountInCents = 1999; // Exemplo: R$ 19,99

    // Obtém o IP do cliente da requisição (essencial para a Utmify)
    // No Vercel/Next.js, o IP é obtido do cabeçalho x-forwarded-for. Para teste, usamos um valor fixo.
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';

    const testPayload: UtmifyOrderPayload = {
      orderId: testOrderId,
      platform: 'RecargaJogo', // Nome da sua plataforma
      paymentMethod: 'pix' as UtmifyPaymentMethod,
      status: 'waiting_payment' as UtmifyOrderStatus, // Status PENDENTE
      createdAt: formatToUtmifyDate(new Date()),
      approvedDate: null, // Ainda não foi aprovado
      refundedAt: null,
      customer: {
        name: 'Cliente Teste Pendente',
        email: 'pendente@example.com',
        phone: '11988887777',
        document: '98765432100',
        country: 'BR',
        ip: ip, // IP do cliente
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
        gatewayFeeInCents: 0, // Taxa é 0 no pedido pendente
        userCommissionInCents: amountInCents,
        currency: 'BRL',
      },
      isTest: false,
    };

    console.log(`[test-webhook-pending] Simulando envio para a Utmify com o payload:`, JSON.stringify(testPayload, null, 2));

    // 2. Chame o serviço da Utmify diretamente.
    const utmifyResponse = await sendOrderToUtmify(testPayload);

    console.log('[test-webhook-pending] Simulação bem-sucedida. Resposta da Utmify:', utmifyResponse);

    return NextResponse.json(
      {
        success: true,
        message: `Webhook de teste PENDENTE executado com sucesso para o pedido ${testOrderId}. Verifique a Utmify e os logs do servidor.`,
        data: utmifyResponse,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[test-webhook-pending] Erro fatal na simulação:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao simular o webhook pendente.',
        error: error.message
      },
      { status: 500 }
    );
  }
}
