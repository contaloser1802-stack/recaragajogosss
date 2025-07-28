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
  // Certifique-se de que UTMIFY_API_URL está definido no seu .env.local
  const UTMIFY_API_URL = process.env.UTMIFY_API_URL || "https://api.utmify.com.br/v1/orders"; // VERIFIQUE ESTA URL!
  // A chave de API da UTMify, obtida das variáveis de ambiente.
  // Certifique-se de que UTMIFY_API_KEY está definido no seu .env.local
  const UTMIFY_API_KEY = process.env.UTMIFY_API_KEY;

  if (!UTMIFY_API_KEY) {
    console.warn("UTMIFY_API_KEY não está definida. O envio para UTMify será ignorado.");
    return { success: false, message: "UTMIFY_API_KEY não configurada." };
  }

  // Define o valor do cabeçalho de autorização como a chave da API diretamente.
  // SE A UTMIFY EXIGIR UM HASH OU OUTRO FORMATO, VOCÊ DEVE ALTERAR ESTA LINHA.
  // Por exemplo, se exigir "Bearer SEU_TOKEN", mude para `Bearer ${UTMIFY_API_KEY}`.
  // Se exigir um hash SHA256/Base64, a lógica de geração do token viria aqui.
  const authorizationHeaderValue = UTMIFY_API_KEY;

  try {
    const response = await fetch(UTMIFY_API_URL, {
      method: 'POST', // Geralmente POST para criar pedidos
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorizationHeaderValue, // Enviando a chave da API diretamente
        // Se a UTMify usar outro cabeçalho, como 'X-Utmify-Auth', altere aqui:
        // 'X-Utmify-Auth': authorizationHeaderValue,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Tenta ler a resposta de erro para depuração (pode ser JSON ou HTML)
      let errorData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json().catch(() => ({ message: 'Erro desconhecido na resposta JSON da UTMify' }));
      } else {
        errorData = await response.text();
        console.error("Resposta da UTMify NÃO É JSON. Conteúdo da resposta:", errorData);
        throw new Error(`Resposta inesperada da UTMify (Status: ${response.status}). Conteúdo: ${errorData.substring(0, 200)}...`);
      }
      console.error(`Erro da UTMify (Status: ${response.status}):`, errorData);
      throw new Error(`Erro UTMify: ${errorData.message || JSON.stringify(errorData) || 'Falha desconhecida'}`);
    }

    const responseData = await response.json();
    console.log("Resposta da UTMify:", responseData);
    return responseData;
  } catch (error) {
    console.error("Erro na comunicação com a API da UTMify:", error);
    // Propaga o erro para que a API Route possa tratá-lo adequadamente
    throw error;
  }
}

/**
 * Formata um objeto Date para uma string no formato "YYYY-MM-DD HH:MM:SS",
 * esperado por algumas APIs como a da UTMify.
 *
 * @param date O objeto Date a ser formatado.
 * @returns A data formatada como string.
 */
export function formatToUtmifyDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês é base 0, então +1
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}