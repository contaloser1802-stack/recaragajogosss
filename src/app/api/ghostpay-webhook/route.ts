// app/api/ghostpay-webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService'; // Ajuste o caminho
import { UtmifyOrderPayload } from '@/interfaces/utmify'; // Ajuste o caminho

// --- Mock de Banco de Dados (Para Demonstração) ---
// Use o mesmo Map ou sua lógica real de BD do create-payment
interface StoredOrderData {
  orderId: string;
  customer: UtmifyCustomer;
  products: UtmifyProduct[];
  trackingParameters: UtmifyTrackingParameters;
  commission: UtmifyCommission;
  createdAt: string;
  platform: string;
}
// Isso deve ser a mesma instância do Map de 'create-payment',
// ou, preferencialmente, uma chamada ao seu DB real.
// Para um exemplo local rápido, pode ser exportado e importado.
// Em produção, isso seria uma chamada ao seu DB.
import { pendingOrders } from '../create-payment/route'; // IMPORTANTE: Mudar para seu DB real
// --- Fim Mock de Banco de Dados ---

// TIPAGEM PARA O WEBHOOK DA GHOSTPAY (ajuste conforme a doc da GhostPay)
interface GhostPayWebhookPayload {
  externalId: string; // ID da transação que você enviou
  status: string; // Ex: 'paid', 'refused', 'refunded'
  amount?: number; // Valor em centavos
  transactionId?: string; // ID interno da transação da GhostPay
  approvedAt?: string; // Data de aprovação (string ISO 8601, se GhostPay fornece)
  // ... outras informações que a GhostPay pode enviar
}

export async function POST(request: NextRequest) {
    console.log("[ghostpay-webhook POST] Webhook da GhostPay recebido.");

    try {
        // **IMPORTANTE: Validação do Webhook**
        // A GhostPay deve ter alguma forma de autenticar o webhook (assinatura, IP fixo, etc.).
        // Você DEVE implementar essa validação aqui para garantir que a requisição é legítima.
        // Ex: const signature = request.headers.get('X-GhostPay-Signature');
        // if (!isValidSignature(request.body, signature, process.env.GHOSTPAY_WEBHOOK_SECRET)) {
        //     return NextResponse.json({ error: 'Assinatura inválida' }, { status: 403 });
        // }

        const webhookData: GhostPayWebhookPayload = await request.json();
        console.log("[ghostpay-webhook POST] Dados do Webhook:", JSON.stringify(webhookData, null, 2));

        const { externalId, status, approvedAt } = webhookData;

        if (!externalId || !status) {
            console.error("[ghostpay-webhook POST] Dados mínimos ausentes no webhook.");
            return NextResponse.json({ error: 'Dados mínimos ausentes' }, { status: 400 });
        }

        // Se o status for 'paid' (ou 'approved', dependendo da GhostPay)
        if (status.toLowerCase() === 'paid') {
            const originalOrderData: StoredOrderData | undefined = pendingOrders.get(externalId); // Busque no seu DB real!

            if (!originalOrderData) {
                console.warn(`[ghostpay-webhook POST] Pedido com externalId ${externalId} não encontrado no DB. Ignorando atualização para UTMify.`);
                // Isso pode acontecer se o webhook for reenviado ou se o salvamento inicial falhou.
                return NextResponse.json({ message: 'Pedido não encontrado, ignorado.' }, { status: 200 });
            }

            const approvedDateUTC = approvedAt ? formatToUtmifyDate(new Date(approvedAt)) : formatToUtmifyDate(new Date());

            const utmifyPayloadApproved: UtmifyOrderPayload = {
                orderId: originalOrderData.orderId,
                platform: originalOrderData.platform,
                paymentMethod: 'pix',
                status: 'paid', // O status mudou para 'paid'
                createdAt: originalOrderData.createdAt, // Mantém a data de criação original
                approvedDate: approvedDateUTC, // Data de aprovação do Pix
                refundedAt: null,
                customer: originalOrderData.customer,
                products: originalOrderData.products,
                trackingParameters: originalOrderData.trackingParameters,
                commission: originalOrderData.commission,
                isTest: process.env.NODE_ENV !== 'production' // true para dev, false para prod
            };

            try {
                await sendOrderToUtmify(utmifyPayloadApproved);
                console.log(`✅ Venda aprovada para o OrderId ${externalId} enviada para a UTMify.`);

                // **IMPORTANTE:** Atualize o status do pedido no seu BANCO DE DADOS
                // Ex: await yourDatabase.updateOrderStatus(externalId, 'paid');
                pendingOrders.delete(externalId); // Remove do mock, em DBs reais você atualiza o status
                console.log(`Pedido ${externalId} atualizado para 'paid' no sistema.`);

                // Lógica de negócio pós-pagamento:
                // - Liberar acesso ao produto/serviço
                // - Enviar e-mail de confirmação ao cliente
                // - Notificar outras partes do sistema
                // ...

            } catch (error) {
                console.error(`❌ Falha ao enviar venda aprovada para a UTMify para o OrderId ${externalId}:`, error);
                // Retorne um 500 para a GhostPay para que ela possa tentar reenviar o webhook (se ela tiver retry)
                return NextResponse.json({ error: 'Erro ao processar webhook internamente.' }, { status: 500 });
            }
        } else if (status.toLowerCase() === 'refused' || status.toLowerCase() === 'cancelled') {
            // Opcional: Enviar status 'refused' para a UTMify se você rastrear isso
            const originalOrderData: StoredOrderData | undefined = pendingOrders.get(externalId);
            if (originalOrderData) {
                const refusedAtUTC = formatToUtmifyDate(new Date());
                const utmifyPayloadRefused: UtmifyOrderPayload = {
                    ...originalOrderData,
                    status: 'refused', // Ou 'cancelled'
                    approvedDate: null,
                    refundedAt: null,
                    isTest: process.env.NODE_ENV !== 'production'
                };
                await sendOrderToUtmify(utmifyPayloadRefused);
                console.log(`Venda ${externalId} recusada/cancelada enviada para a UTMify.`);
                pendingOrders.delete(externalId); // Remove do mock
                // Atualizar status no DB
            }
            console.log(`Webhook para o pedido ${externalId} com status: ${status}.`);
        } else {
            console.log(`Webhook para o pedido ${externalId} com status: ${status}. Nenhuma ação de tracking para a UTMify.`);
        }

        // Sempre retorne um 200 OK para o webhook assim que você o processar
        // Isso impede que a GhostPay tente reenviar a notificação repetidamente.
        return NextResponse.json({ message: 'Webhook recebido e processado com sucesso.' }, { status: 200 });

    } catch (error: any) {
        console.error("[ghostpay-webhook POST] ERRO FATAL AO PROCESSAR WEBHOOK:", error);
        // Em caso de erro, você pode retornar um 500 para que o provedor do webhook tente novamente.
        return NextResponse.json({ error: error.message || 'Erro interno do servidor ao processar webhook.' }, { status: 500 });
    }
}