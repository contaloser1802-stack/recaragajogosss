// src/lib/utmifyService.ts

import { UtmifyOrderPayload } from '@/interfaces/utmify';

/**
 * Envia dados de pedido para a API da UTMify.
 *
 * @param payload O payload do pedido no formato UtmifyOrderPayload.
 * @returns A resposta da API da UTMify.
 * @throws Um erro se a comunicação com a API da UTMify falhar.
 */
export async function sendOrderToUtmify(payload: UtmifyOrderPayload): Promise<any> {
  console.log("Tentando enviar dados para UTMify:", JSON.stringify(payload, null, 2));

  // A URL da API da UTMify, obtida das variáveis de ambiente.
  const UTMIFY_API_URL = process.env.UTMIFY_API_URL;
  // A chave de API da UTMify, obtida das variáveis de ambiente.
  const UTMIFY_API_KEY = process.env.UTMIFY_API_KEY;

  if (!UTMIFY_API_KEY) {
    console.error("ERRO: UTMIFY_API_KEY não está definida. O envio para UTMify será ignorado.");
    throw new Error("A chave da API da Utmify (UTMIFY_API_KEY) não está configurada no servidor.");
  }
  
  if (!UTMIFY_API_URL) {
    console.error("ERRO: UTMIFY_API_URL não está definida. O envio para UTMify será ignorado.");
    throw new Error("A URL da API da Utmify (UTMIFY_API_URL) não está configurada no servidor.");
  }


  try {
    const response = await fetch(UTMIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': UTMIFY_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    // A Utmify retorna 200 para sucesso e outros códigos para erro.
    // O corpo da resposta pode ser JSON ou texto/html em caso de erro de servidor.
    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
    } else {
        responseData = await response.text();
    }

    if (!response.ok) {
      console.error(`Erro ao enviar para Utmify (Status: ${response.status}):`, responseData);
      // Lança um erro com detalhes para ser capturado no catch do chamador.
      const errorMessage = typeof responseData === 'object' && responseData !== null && (responseData as any).message
        ? (responseData as any).message
        : (typeof responseData === 'string' ? responseData : 'Erro desconhecido da Utmify');
      throw new Error(`Erro Utmify: ${errorMessage}`);
    }

    console.log("Resposta da Utmify:", responseData);
    return responseData;
  } catch (error) {
    console.error("Erro na comunicação com a API da Utmify:", error);
    // Propaga o erro para que a API Route possa tratá-lo adequadamente.
    // Isso é importante para que o fluxo de pagamento possa continuar mesmo que a Utmify falhe.
    throw error;
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
    // Usando métodos UTC para garantir a consistência de fuso horário
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
