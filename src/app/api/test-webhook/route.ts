// src/app/api/test-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Esta é uma rota de TESTE para simular o webhook da GhostPay.
// Você pode usá-la para verificar se as vendas aprovadas estão sendo enviadas corretamente para a Utmify.
// Para usar, acesse a URL /api/test-webhook no seu navegador.
// Lembre-se de remover este arquivo quando não precisar mais dele.

export async function GET(request: NextRequest) {
  try {
    // 1. Crie um payload de exemplo que imita o que a GhostPay enviaria.
    // Use um ID de pedido único para cada teste para vê-lo na Utmify.
    const testOrderId = `TEST-${Date.now()}`;

    const testPayload = {
      id: testOrderId,
      status: 'APPROVED', // Ou 'PAID'
      amount: 5000, // Exemplo: R$ 50,00 em centavos
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      customer: {
        name: 'Cliente Teste',
        email: 'teste@example.com',
        phone: '11999998888',
        cpf: '12345678900',
        ipAddress: '127.0.0.1',
      },
      items: [
        {
          id: 'prod-teste-123',
          title: 'Produto de Teste',
          quantity: 1,
          unitPrice: 5000,
        },
      ],
      utmQuery: {
        utm_source: 'teste-source',
        utm_campaign: 'teste-campaign',
        utm_medium: 'teste-medium',
        sck: 'teste-sck'
      },
    };

    // 2. Determine a URL completa do seu webhook.
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/ghostpay-webhook`;

    console.log(`[test-webhook] Simulando chamada para: ${webhookUrl}`);
    console.log(`[test-webhook] Payload de teste:`, JSON.stringify(testPayload, null, 2));

    // 3. Faça uma requisição POST para o seu próprio webhook, simulando a GhostPay.
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    // 4. Verifique a resposta do seu webhook.
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[test-webhook] Erro ao chamar o webhook: ${response.status}`, errorText);
      return NextResponse.json(
        {
          success: false,
          message: 'Erro ao simular o webhook.',
          webhook_status: response.status,
          webhook_response: errorText,
        },
        { status: 500 }
      );
    }

    const responseData = await response.json();
    console.log('[test-webhook] Simulação bem-sucedida. Resposta do webhook:', responseData);

    return NextResponse.json(
      {
        success: true,
        message: `Webhook de teste executado com sucesso para o pedido ${testOrderId}. Verifique a Utmify e os logs do servidor.`,
        data: responseData,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[test-webhook] Erro fatal na simulação:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
