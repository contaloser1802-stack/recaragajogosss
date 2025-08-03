import { UtmifyOrderPayload } from '@/interfaces/utmify';
import getConfig from 'next/config';

/**
 * Formata um objeto Date para o formato 'YYYY-MM-DD HH:MM:SS' em UTC.
 * @param date O objeto Date a ser formatado.
 * @returns A string da data formatada ou null se a data for inválida.
 */
export function formatToUtmifyDate(date: Date | null): string | null {
    if (!date || isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Envia os dados de um pedido para a API da Utmify.
 * @param payload O corpo do pedido a ser enviado.
 */
export async function sendOrderToUtmify(payload: UtmifyOrderPayload): Promise<void> {
    const { serverRuntimeConfig } = getConfig();
    const apiUrl = serverRuntimeConfig.UTMIFY_API_URL;
    const apiKey = serverRuntimeConfig.UTMIFY_API_TOKEN;

    if (!apiUrl || !apiKey) {
        throw new Error('Credenciais da Utmify (UTMIFY_API_URL ou UTMIFY_API_TOKEN) não estão configuradas no servidor.');
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Resposta de erro não é JSON' }));
            const errorMessage = `Erro da API Utmify: ${response.status} - ${JSON.stringify(errorBody)}`;
            console.error('[UtmifyService] Erro ao enviar pedido:', errorMessage);
            throw new Error(errorMessage);
        }

        console.log(`[UtmifyService] Pedido ${payload.orderId} com status ${payload.status} enviado com sucesso para Utmify.`);
    } catch (error: any) {
        console.error(`[UtmifyService] Erro desconhecido ao comunicar com a Utmify: ${error.message}`);
        throw new Error(`Erro desconhecido ao comunicar com a Utmify: ${error.message}`);
    }
}
