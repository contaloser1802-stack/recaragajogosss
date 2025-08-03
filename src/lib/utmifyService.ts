// src/lib/utmifyService.ts
import { UtmifyOrderPayload } from '@/interfaces/utmify';
import axios from 'axios';

/**
 * Envia dados de pedido para a API da UTMify.
 *
 * @param payload O payload do pedido no formato UtmifyOrderPayload.
 * @returns A resposta da API da UTMify.
 * @throws Um erro se a comunicação com a API da UTMify falhar.
 */
export async function sendOrderToUtmify(payload: UtmifyOrderPayload): Promise<any> {
  const UTMIFY_API_URL = process.env.UTMIFY_API_URL;
  const UTMIFY_API_TOKEN = process.env.UTMIFY_API_KEY;

  if (!UTMIFY_API_TOKEN || !UTMIFY_API_URL) {
    const errorMessage = "Credenciais da Utmify (UTMIFY_API_URL ou UTMIFY_API_KEY) não estão configuradas no servidor.";
    console.error(`[UtmifyService] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  console.log("[UtmifyService] 📤 Enviando payload para Utmify:", JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(UTMIFY_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': UTMIFY_API_TOKEN,
      },
    });

    console.log(`[UtmifyService] ✅ Sucesso! Resposta da Utmify (Status: ${response.status}):`, response.data);
    return response.data;
    
  } catch (error: any) {
    let errorMessage = "Erro desconhecido ao comunicar com a Utmify.";
    
    if (axios.isAxiosError(error)) {
        if (error.response) {
            errorMessage = `Erro da API Utmify: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
            console.error(`[UtmifyService] ❌ Erro de resposta da Utmify:`, {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
            });
        } else if (error.request) {
            errorMessage = "Nenhuma resposta recebida da Utmify. Verifique a conectividade.";
            console.error('[UtmifyService] ❌ Nenhuma resposta da Utmify:', error.request);
        } else {
            errorMessage = `Erro ao configurar requisição para Utmify: ${error.message}`;
            console.error('[UtmifyService] ❌ Erro de configuração da requisição:', error.message);
        }
    } else {
        console.error('[UtmifyService] ❌ Erro inesperado:', error);
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Formata um objeto Date para uma string no formato "YYYY-MM-DD HH:MM:SS" (UTC),
 * esperado pela API da UTMify.
 *
 * @param date O objeto Date a ser formatado.
 * @returns A data formatada como string em UTC.
 */
export function formatToUtmifyDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}