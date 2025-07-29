
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload } from '@/interfaces/utmify';

// Lida com requisições POST para simular um pagamento aprovado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[simulate-payment POST] Corpo da requisição recebido:", JSON.stringify(body, null, 2));

    const { 
      customer, // { name, email, phone, cpf }
      items,    // Array de produtos
      totalAmountInCents,
      utmQuery,
      orderId, // ID da transação (pode ser simulado)
    } = body;
    
    // Validação básica
    if (!customer || !items || items.length === 0 || !totalAmountInCents) {
      console.error("[simulate-payment POST] Payload de simulação inválido. Faltam dados essenciais.");
      return NextResponse.json({ error: 'Payload de simulação inválido.' }, { status: 400 });
    }

    const utmParams = new URLSearchParams(utmQuery);
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';

    // Monta o payload para a Utmify como se tivesse vindo de um webhook de pagamento APROVADO
    const utmifyPayload: UtmifyOrderPayload = {
        orderId: orderId || `sim-${Date.now()}`,
        platform: 'RecargaJogo',
        paymentMethod: 'pix',
        status: 'paid', // Status de venda APROVADA na Utmify
        createdAt: formatToUtmifyDate(new Date()),
        approvedDate: formatToUtmifyDate(new Date()), // Data de aprovação é agora
        refundedAt: null,
        customer: {
            name: customer.name || 'Cliente Simulado',
            email: customer.email || 'email@simulado.com',
            phone: customer.phone?.replace(/\D/g, '') || null,
            document: customer.cpf?.replace(/\D/g, '') || null,
            country: 'BR',
            ip: ip,
        },
        products: items.map((item: any) => ({
            id: item.id || `prod_sim_${Date.now()}`,
            name: item.title || 'Produto Simulado',
            planId: null,
            planName: null,
            quantity: item.quantity || 1,
            priceInCents: Math.round(parseFloat(item.unitPrice || 0) * 100), // Garante que é centavos
        })),
        trackingParameters: {
            src: utmParams.get('utm_source'),
            sck: utmParams.get('sck'),
            utm_source: utmParams.get('utm_source'),
            utm_campaign: utmParams.get('utm_campaign'),
            utm_medium: utmParams.get('utm_medium'),
            utm_content: utmParams.get('utm_content'),
            utm_term: utmParams.get('utm_term'),
        },
        commission: {
            totalPriceInCents: totalAmountInCents,
            gatewayFeeInCents: 0, 
            userCommissionInCents: totalAmountInCents,
            currency: 'BRL',
        },
        isTest: true, // Marcar como teste na Utmify
    };

    console.log("[simulate-payment POST] 📦 Payload de simulação montado para Utmify:", JSON.stringify(utmifyPayload, null, 2));

    await sendOrderToUtmify(utmifyPayload);
    console.log(`[simulate-payment POST] ✅ Simulação do pedido ${utmifyPayload.orderId} enviada para Utmify com sucesso.`);

    return NextResponse.json({ success: true, message: 'Pagamento simulado e enviado para a Utmify com sucesso.' });

  } catch (error: any) {
    console.error("[simulate-payment POST] ❌ Erro fatal ao processar simulação:", error.message);
    
    // Verifica se o erro já é uma resposta da Utmify para retornar um erro mais detalhado
    if (error.message.includes("Erro da API Utmify")) {
        return NextResponse.json({ error: `Falha ao enviar para Utmify: ${error.message}` }, { status: 502 }); // Bad Gateway
    }

    return NextResponse.json({ error: 'Erro interno do servidor ao simular pagamento.' }, { status: 500 });
  }
}
