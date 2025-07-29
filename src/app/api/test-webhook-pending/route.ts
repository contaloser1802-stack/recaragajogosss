// src/app/api/test-webhook-pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload, UtmifyPaymentMethod, UtmifyOrderStatus } from '@/interfaces/utmify';

// Esta é uma rota de TESTE para simular o envio de um pedido PENDENTE para a Utmify.
// Agora ela gera 99 notificações de uma vez, com valores e intervalos aleatórios.
// Para usar, acesse a URL /api/test-webhook-pending no seu navegador.

const possibleValues = [1990, 2980, 7480, 10870]; // R$19,90, R$29,80, R$74,80, R$108,70

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  try {
    const createdOrderIds: string[] = [];

    // Não aguarde a conclusão de todos os envios.
    // Inicie o processo e responda imediatamente.
    (async () => {
      for (let i = 0; i < 99; i++) {
        // Adiciona um atraso aleatório de 0 a 1.5 segundos antes de processar
        await delay(Math.random() * 1500);

        // Seleciona um valor aleatório da lista
        const randomAmountInCents = possibleValues[Math.floor(Math.random() * possibleValues.length)];

        // 1. Crie um payload de exemplo que imita o que seria enviado na criação de um pagamento.
        const testOrderId = `TEST-PENDING-${Date.now()}-${i}`;
        createdOrderIds.push(testOrderId);

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
              id: `prod-teste-${randomAmountInCents}`,
              name: `@jaozw.7`,
              planId: null,
              planName: null,
              quantity: 1,
              priceInCents: randomAmountInCents,
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
            totalPriceInCents: randomAmountInCents,
            gatewayFeeInCents: 0,
            userCommissionInCents: randomAmountInCents,
            currency: 'BRL',
          },
          isTest: false,
        };

        console.log(`[test-webhook-pending] [${i+1}/99] Simulando envio para a Utmify com o payload:`, JSON.stringify(testPayload, null, 2));

        // Envia para a Utmify mas não espera pela resposta aqui
        sendOrderToUtmify(testPayload).catch(err => {
            console.error(`[test-webhook-pending] Erro ao enviar o pedido ${testOrderId} em segundo plano:`, err.message);
        });
      }
      console.log(`[test-webhook-pending] Simulação em segundo plano concluída. 99 pedidos enviados para processamento.`);
    })();
    
    // Retorna uma resposta imediata para o navegador
    return NextResponse.json(
      {
        success: true,
        message: `Simulação de webhook PENDENTE iniciada. 99 pedidos estão sendo enviados para a Utmify em segundo plano.`,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[test-webhook-pending] Erro fatal na simulação:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro fatal ao iniciar a simulação do webhook pendente.',
        error: error.message
      },
      { status: 500 }
    );
  }
}
