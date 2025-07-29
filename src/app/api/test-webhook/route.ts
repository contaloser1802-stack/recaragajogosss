
// src/app/api/test-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

// --- Funções de Geração de Dados Aleatórios ---

const firstNames = ["Carlos", "Fernanda", "Juliano", "Beatriz", "Lucas", "Patrícia", "Ricardo", "Camila", "Márcio", "Vanessa", "Leonardo", "Tatiane", "Eduardo", "Renata", "Fábio", "Cristina", "Sandro", "Daniela", "Leandro", "Priscila"];
const lastNames = ["Rocha", "Nunes", "Mendes", "Rezende", "Cardoso", "Teixeira", "Araújo", "Campos", "Freitas", "Pinto", "Moura", "Dias", "Castro", "Nascimento", "Moreira", "Neves", "Siqueira", "Brandão", "Queiroz", "Borges"];
const domains = ["uol.com.br", "terra.com.br", "ig.com.br", "bol.com.br", "globomail.com"];
const ddds = ["11", "21", "31", "41", "51", "61", "71", "81", "91", "12", "19", "22", "27", "48", "85"];

const utmSources = ['MetaAds', 'GoogleAds', 'TikTokAds', 'Taboola', 'KwaiAds'];
const utmCampaigns = ['FreeFireQuiz', 'DiamondPromo', 'LevelUpJuly', 'WinterSale', 'BooyahPass'];
const utmMediums = ['Paid_Social', 'CPC', 'Display', 'Video', 'retargeting'];
const utmScks = ['ad1-video-desktop', 'ad2-banner-mobile', 'ad3-story-reels', 'ad4-search-top', 'ad5-carousel-feed'];


const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateRandomName = () => `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
const generateRandomEmail = (name: string) => `${name.toLowerCase().replace(' ', '_').substring(0, 15)}${Math.floor(Math.random() * 99)}@${getRandomItem(domains)}`;
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
    const promises = [];
    const createdOrderIds = [];
    const webhookUrl = new URL('/api/ghostpay-webhook', request.url).toString();

    for (let i = 0; i < 5; i++) {
        await delay(Math.random() * 1500);

        const randomAmount = possibleValues[Math.floor(Math.random() * possibleValues.length)];
        const testOrderId = `TEST-APPROVED-${Date.now()}-${i}`;
        createdOrderIds.push(testOrderId);

        const randomName = generateRandomName();

        const testPayload = {
            id: testOrderId,
            status: 'APPROVED',
            amount: randomAmount,
            createdAt: new Date().toISOString(),
            paidAt: new Date().toISOString(),
            customer: {
                name: randomName,
                email: generateRandomEmail(randomName),
                phone: generateRandomPhone(),
                cpf: gerarCPFValido(),
                ipAddress: '127.0.0.1',
            },
            items: [
                {
                    id: `Prod-${randomAmount}`,
                    title: `@rogi.sensi`,
                    quantity: 1,
                    unitPrice: randomAmount,
                },
            ],
            utmQuery: {
                utm_source: getRandomItem(utmSources),
                utm_campaign: getRandomItem(utmCampaigns),
                utm_medium: getRandomItem(utmMediums),
                sck: getRandomItem(utmScks)
            },
            isTest: false,
        };
        
        console.log(`[test-webhook] [${i + 1}/5] Simulando chamada para o webhook com o payload:`, JSON.stringify(testPayload, null, 2));

        const promise = fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload),
        }).then(res => {
            if (!res.ok) {
                console.error(`[test-webhook] Chamada para webhook falhou para o pedido ${testOrderId} com status ${res.status}`);
            }
            return res.json();
        }).catch(err => {
            console.error(`[test-webhook] Erro de fetch para o pedido ${testOrderId}:`, err);
            return { status: 'rejected', reason: err.message };
        });

        promises.push(promise);
    }

    const results = await Promise.allSettled(promises);

    const successfulInvocations = results.filter(r => r.status === 'fulfilled').length;
    const failedInvocations = results.filter(r => r.status === 'rejected');

    console.log(`[test-webhook] Simulação concluída. ${successfulInvocations} sucessos, ${failedInvocations.length} falhas.`);
    if (failedInvocations.length > 0) {
        console.error('[test-webhook] Detalhes das falhas:', failedInvocations);
    }
    
    return NextResponse.json(
      {
        success: true,
        message: `Simulação de webhook APROVADO executada. ${successfulInvocations} de 5 pedidos enviados para a Utmify.`,
        createdOrderIds: createdOrderIds,
        results: results.map(r => r.status)
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[test-webhook] Erro fatal na simulação:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
