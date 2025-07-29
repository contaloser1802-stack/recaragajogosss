
// src/app/api/test-webhook-pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderToUtmify, formatToUtmifyDate } from '@/lib/utmifyService';
import { UtmifyOrderPayload, UtmifyPaymentMethod, UtmifyOrderStatus } from '@/interfaces/utmify';

// --- Funções de Geração de Dados Aleatórios ---

const firstNames = ["Miguel", "Arthur", "Gael", "Théo", "Heitor", "Ravi", "Davi", "Bernardo", "Noah", "Gabriel", "Helena", "Alice", "Laura", "Maria", "Sophia", "Isabella", "Luísa", "Isis", "Júlia", "Maitê"];
const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa"];
const domains = ["gmail.com", "hotmail.com", "yahoo.com", "outlook.com", "live.com"];
const ddds = ["11", "21", "31", "41", "51", "61", "71", "81", "91"];

const utmSources = ['MetaAds', 'GoogleAds', 'TikTokAds', 'Taboola', 'KwaiAds'];
const utmCampaigns = ['FreeFireQuiz', 'DiamondPromo', 'LevelUpJuly', 'WinterSale', 'BooyahPass'];
const utmMediums = ['Paid_Social', 'CPC', 'Display', 'Video', 'retargeting'];
const utmScks = ['ad1-video-desktop', 'ad2-banner-mobile', 'ad3-story-reels', 'ad4-search-top', 'ad5-carousel-feed'];


const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateRandomName = () => `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
const generateRandomEmail = (name: string) => `${name.toLowerCase().replace(' ', '.').substring(0, 15)}${Math.floor(Math.random() * 999)}@${getRandomItem(domains)}`;
const generateRandomPhone = () => {
    const ddd = getRandomItem(ddds);
    const number = Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 9);
    return `${ddd}9${number}`;
};

function gerarDigitoVerificador(cpfParcial: string) {
    let soma = 0;
    for (let i = 0, peso = cpfParcial.length + 1; i < cpfParcial.length; i++, peso--) {
        soma += parseInt(cpfParcial.charAt(i)) * peso;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
}

function gerarCPFValido() {
    let cpf = '';
    for (let i = 0; i < 9; i++) {
        cpf += Math.floor(Math.random() * 10);
    }
    cpf += gerarDigitoVerificador(cpf);
    cpf += gerarDigitoVerificador(cpf);
    return cpf;
}

// --- Fim das Funções de Geração ---


const possibleValues = [2990, 5780, 12790];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  try {
    const createdOrderIds: string[] = [];

    (async () => {
      for (let i = 0; i < 5; i++) {
        await delay(Math.random() * 1500);

        const randomAmountInCents = possibleValues[Math.floor(Math.random() * possibleValues.length)];
        const testOrderId = `TEST-PENDING-${Date.now()}-${i}`;
        createdOrderIds.push(testOrderId);
        
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        
        const randomName = generateRandomName();

        const testPayload: UtmifyOrderPayload = {
          orderId: testOrderId,
          platform: 'RecargaJogo',
          paymentMethod: 'pix' as UtmifyPaymentMethod,
          status: 'waiting_payment' as UtmifyOrderStatus,
          createdAt: formatToUtmifyDate(new Date()),
          approvedDate: null,
          refundedAt: null,
          customer: {
            name: randomName,
            email: generateRandomEmail(randomName),
            phone: generateRandomPhone(),
            document: gerarCPFValido(),
            country: 'BR',
            ip: ip,
          },
          products: [
            {
              id: `prod-teste-${randomAmountInCents}`,
              name: `@jaozw.7`,
              planId: null,
              planName: null,
              quantity: 1,
              priceInCents: randomAmountInCents,
            },
          ],
          trackingParameters: {
            src: getRandomItem(utmSources),
            sck: getRandomItem(utmScks),
            utm_source: getRandomItem(utmSources),
            utm_campaign: getRandomItem(utmCampaigns),
            utm_medium: getRandomItem(utmMediums),
            utm_content: null,
            utm_term: null,
          },
          commission: {
            totalPriceInCents: randomAmountInCents,
            gatewayFeeInCents: 0,
            userCommissionInCents: randomAmountInCents,
            currency: 'BRL',
          },
          isTest: false,
        };

        console.log(`[test-webhook-pending] [${i+1}/5] Simulando envio para a Utmify com o payload:`, JSON.stringify(testPayload, null, 2));

        sendOrderToUtmify(testPayload).catch(err => {
            console.error(`[test-webhook-pending] Erro ao enviar o pedido ${testOrderId} em segundo plano:`, err.message);
        });
      }
      console.log(`[test-webhook-pending] Simulação em segundo plano concluída. 5 pedidos enviados para processamento.`);
    })();
    
    return NextResponse.json(
      {
        success: true,
        message: `Simulação de webhook PENDENTE iniciada. 5 pedidos estão sendo enviados para a Utmify em segundo plano.`,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[test-webhook-pending] Erro fatal na simulação:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro fatal ao iniciar a simulação do webhook pendente.',
        error: error.message
      },
      { status: 500 }
    );
  }
}
