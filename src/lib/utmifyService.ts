/**
 * @fileOverview Módulo de serviço para interagir com a API da Utmify.
 */
import getConfig from 'next/config';
import { UtmifyOrderPayload } from '@/interfaces/utmify';

const { serverRuntimeConfig } = getConfig();

// Função para formatar a data no padrão 'YYYY-MM-DD HH:MM:SS' UTC
export function formatToUtmifyDate(date: Date | null): string | null {
    if (!date) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Envia os dados de um pedido para a API da Utmify.
 * @param payload O corpo da requisição para a API da Utmify.
 */
export async function sendOrderToUtmify(payload: UtmifyOrderPayload): Promise<void> {
    const UTMIFY_API_URL = serverRuntimeConfig.UTMIFY_API_URL;
    const UTMIFY_API_TOKEN = serverRuntimeConfig.UTMIFY_API_TOKEN;

    if (!UTMIFY_API_URL || !UTMIFY_API_TOKEN) {
        const errorMsg = `[UtmifyService] Configuração da API da Utmify incompleta. URL ou Token não definidos.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    
    try {
        const response = await fetch(UTMIFY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-token': UTMIFY_API_TOKEN,
                'User-Agent': 'RecargaJogo/1.0'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            const errorMessage = `Erro da API Utmify: ${response.status} - ${JSON.stringify(errorBody)}`;
            console.error('[UtmifyService] Erro ao enviar pedido:', errorMessage);
            throw new Error(errorMessage);
        }

        console.log(`[UtmifyService] Pedido ${payload.orderId} com status ${payload.status} enviado com sucesso para Utmify.`);
    } catch (error: any) {
        console.error('[UtmifyService] Erro desconhecido ao comunicar com a Utmify:', error.message);
        throw error; // Re-lança o erro para que a rotina de chamada possa tratá-lo
    }
}
