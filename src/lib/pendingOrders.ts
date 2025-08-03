/**
 * @fileOverview Gerenciamento de pedidos pendentes para webhooks.
 *
 * Este módulo oferece funções para salvar, recuperar e remover dados de pedidos
 * que estão aguardando uma notificação de webhook (ex: confirmação de pagamento).
 * 
 * ATENÇÃO: Esta é uma implementação simples em memória e não é adequada para produção
 * em um ambiente com múltiplos servidores (serverless functions), pois o estado
 * não é compartilhado. Para produção, substitua este armazenamento em memória
 * por uma solução persistente como Redis, Firestore, ou um banco de dados SQL.
 */

import { UtmifyOrderPayload } from '@/interfaces/utmify';

// Armazenamento em memória. Chave: transactionId, Valor: UtmifyOrderPayload
const pendingOrders = new Map<string, UtmifyOrderPayload>();

/**
 * Salva os detalhes de um pedido pendente.
 * @param transactionId O ID da transação do gateway de pagamento.
 * @param payload O payload completo do pedido enviado para a Utmify com status 'waiting_payment'.
 */
export async function savePendingOrder(transactionId: string, payload: UtmifyOrderPayload): Promise<void> {
  console.log(`[PendingOrders] Salvando pedido pendente para o ID: ${transactionId}`);
  pendingOrders.set(transactionId, payload);
}

/**
 * Recupera os detalhes de um pedido pendente.
 * @param transactionId O ID da transação a ser recuperado.
 * @returns O payload do pedido salvo ou null se não for encontrado.
 */
export async function getPendingOrder(transactionId: string): Promise<UtmifyOrderPayload | null> {
  console.log(`[PendingOrders] Buscando pedido pendente com ID: ${transactionId}`);
  const order = pendingOrders.get(transactionId);
  return order || null;
}

/**
 * Remove um pedido pendente do armazenamento.
 * @param transactionId O ID da transação a ser removida.
 */
export async function removePendingOrder(transactionId: string): Promise<void> {
    if (pendingOrders.has(transactionId)) {
        console.log(`[PendingOrders] Removendo pedido pendente com ID: ${transactionId}`);
        pendingOrders.delete(transactionId);
    } else {
        console.warn(`[PendingOrders] Tentativa de remover pedido pendente não encontrado com ID: ${transactionId}`);
    }
}
