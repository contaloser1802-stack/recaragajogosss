/**
 * @fileOverview Módulo de serviço para interagir com a API da Buckpay.
 */
import axios from 'axios';

const BUCKPAY_API_URL = 'https://api.realtechdev.com.br/v1';
const BUCKPAY_API_TOKEN = process.env.BUCKPAY_API_TOKEN;

/**
 * Busca os detalhes completos de uma transação pelo seu ID.
 * @param transactionId O ID da transação na Buckpay.
 * @returns Os dados da transação ou null em caso de erro.
 */
export async function getTransactionById(transactionId: string): Promise<any | null> {
    if (!BUCKPAY_API_TOKEN) {
         const errorMsg = `[BuckpayService] Não é possível buscar a transação ${transactionId} pois o token da API (BUCKPAY_API_TOKEN) não está configurado.`;
         console.error(errorMsg);
         // Lançar um erro aqui para que a função chamadora saiba que falhou.
         throw new Error(errorMsg);
    }
    try {
        console.log(`[BuckpayService] Buscando detalhes da transação ID: ${transactionId}`);
        const response = await axios.get(`${BUCKPAY_API_URL}/transactions/${transactionId}`, {
             headers: {
                'Authorization': `Bearer ${BUCKPAY_API_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'RecargaJogo-Integration/1.0'
            }
        });
        console.log(`[BuckpayService] Detalhes da transação ${transactionId} obtidos com sucesso.`);
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
        // Retornar null para indicar que a busca falhou.
        return null;
    }
}
