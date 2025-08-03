/**
 * @fileOverview Módulo de serviço para interagir com a API da Buckpay.
 */
import axios from 'axios';

const BUCKPAY_API_URL = 'https://api.realtechdev.com.br/v1';
const BUCKPAY_API_TOKEN = process.env.BUCKPAY_API_TOKEN;

if (!BUCKPAY_API_TOKEN) {
    console.error("[BuckpayService] ERRO CRÍTICO: BUCKPAY_API_TOKEN não está definido no ambiente.");
}

const buckpayApi = axios.create({
    baseURL: BUCKPAY_API_URL,
    headers: {
        'Authorization': `Bearer ${BUCKPAY_API_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'RecargaJogo-Integration/1.0'
    }
});

/**
 * Busca os detalhes completos de uma transação pelo seu ID.
 * @param transactionId O ID da transação na Buckpay.
 * @returns Os dados da transação ou null em caso de erro.
 */
export async function getTransactionById(transactionId: string): Promise<any | null> {
    if (!BUCKPAY_API_TOKEN) {
         console.error(`[BuckpayService] Não é possível buscar a transação ${transactionId} pois o token da API não está configurado.`);
         return null;
    }
    try {
        console.log(`[BuckpayService] Buscando detalhes da transação ID: ${transactionId}`);
        const response = await buckpayApi.get(`/transactions/${transactionId}`);
        console.log(`[BuckpayService] Detalhes da transação ${transactionId} obtidos com sucesso.`);
        // A API da Buckpay pode aninhar a resposta em 'data'. Normalizamos isso aqui.
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`[BuckpayService] Erro ao buscar transação ${transactionId}:`, {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
        } else {
            console.error(`[BuckpayService] Erro inesperado ao buscar transação ${transactionId}:`, error);
        }
        return null;
    }
}
