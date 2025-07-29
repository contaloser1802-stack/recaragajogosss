
// src/app/api/test-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { POST as handleWebhook } from '@/app/api/ghostpay-webhook/route'; // Importa a função do webhook

// Esta é uma rota de TESTE para simular o webhook da GhostPay.
// Agora ela gera 29 notificações de uma vez, com valores e intervalos aleatórios.
// Para usar, acesse a URL /api/test-webhook no seu navegador.

const possibleValues = [1990, 4990, 8990, 14990]; // R$19,99, R$49,90, R$89,90, R$149,90

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  try {
    const promises = [];
    const createdOrderIds = [];

    for (let i = 0; i < 29; i++) {
        // Adiciona um atraso aleatório de 0 a 1.5 segundos antes de processar
        await delay(Math.random() * 1500);

        // Seleciona um valor aleatório da lista
        const randomAmount = possibleValues[Math.floor(Math.random() * possibleValues.length)];

        // 1. Crie um payload de exemplo que imita o que a GhostPay enviaria.
        const testOrderId = `TEST-APPROVED-${Date.now()}-${i}`;
        createdOrderIds.push(testOrderId);

        const testPayload = {
            id: testOrderId,
            status: 'APPROVED',
            amount: randomAmount, // Usa o valor aleatório
            createdAt: new Date().toISOString(),
            paidAt: new Date().toISOString(),
            customer: {
                name: 'Cliente Teste Aprovado',
                email: 'aprovado@example.com',
                phone: '11999998888',
                cpf: '12345678900',
                ipAddress: '127.0.0.1',
            },
            items: [
                {
                    id: `prod-teste-${randomAmount}`,
                    title: `@jaozw.7`,
                    quantity: 1,
                    unitPrice: randomAmount, // O preço do item é o valor total
                },
            ],
            utmQuery: {
                utm_source: 'teste-source',
                utm_campaign: 'teste-campaign',
                utm_medium: 'teste-medium',
                sck: 'teste-sck'
            },
            isTest: false,
        };
        
        console.log(`[test-webhook] [${i + 1}/29] Simulando chamada para o webhook com o payload:`, JSON.stringify(testPayload, null, 2));

        // 2. Crie um objeto de requisição simulado para passar para a função do webhook.
        const mockRequest = new NextRequest(new URL(request.url).origin, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload),
        });

        // 3. Adiciona a promessa de chamada do webhook à lista.
        promises.push(handleWebhook(mockRequest));
    }

    // 4. Executa todas as promessas em paralelo.
    const results = await Promise.allSettled(promises);

    const successfulInvocations = results.filter(r => r.status === 'fulfilled').length;
    const failedInvocations = results.filter(r => r.status === 'rejected');

    console.log(`[test-webhook] Simulação concluída. ${successfulInvocations} sucessos, ${failedInvocations.length} falhas.`);
    if (failedInvocations.length > 0) {
        console.error('[test-webhook] Detalhes das falhas:', failedInvocations);
    }
    
    return NextResponse.json(
      {
        success: true,
        message: `Simulação de webhook APROVADO executada. ${successfulInvocations} de 29 pedidos enviados para a Utmify.`,
        createdOrderIds: createdOrderIds,
        results: results.map(r => r.status)
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[test-webhook] Erro fatal na simulação:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
