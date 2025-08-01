
export const banners = [
    { 
        src: 'https://contentgarena-a.akamaihd.net/GOP/newshop_banners/26B06340B596B357.png?v=1729016596', 
        alt: 'Banner 1' 
    },
    { 
        src: 'https://contentgarena-a.akamaihd.net/GOP/newshop_banners/47BED91C7ABCF1EA.png?v=1752155361', 
        alt: 'Banner 2' 
    },
    { 
        src: 'https://contentgarena-a.akamaihd.net/GOP/newshop_banners/47C95AECB3BF44D6.jpg?v=1753969332', 
        alt: 'Banner 3' 
    },
    { 
        src: 'https://contentgarena-a.akamaihd.net/GOP/newshop_banners/6FAE33F6E97F3F4C.png?v=1752169162', 
        alt: 'Banner 4' 
    },
    { 
        src: 'https://contentgarena-a.akamaihd.net/GOP/newshop_banners/77EA32E48F86033D.jpg?v=1753856459', 
        alt: 'Banner 5'
    },
];

export const diamondPacks = [
    { id: 'pack-520', name: '520 Diamantes', originalAmount: '520', bonusAmount: '104', totalAmount: '624', price: 9.90, formattedPrice: 'R$ 9,90' },
    { id: 'pack-1060', name: '1.060 Diamantes', originalAmount: '1.060', bonusAmount: '212', totalAmount: '1.272', price: 14.90, formattedPrice: 'R$ 14,90' },
    { id: 'pack-2180', name: '2.180 Diamantes', originalAmount: '2.180', bonusAmount: '2.180', totalAmount: '4.360', price: 19.90, formattedPrice: 'R$ 19,90', promo: 'DOBRO DE DIAMANTES' },
    { id: 'pack-5600', name: '5.600 Diamantes', originalAmount: '5.600', bonusAmount: '5.600', totalAmount: '11.200', price: 37.80, formattedPrice: 'R$ 37,80', promo: 'DOBRO DE DIAMANTES' },
    { id: 'pack-12800', name: '12.800 Diamantes', originalAmount: '12.800', bonusAmount: '0', totalAmount: '12.800', price: 109.99, formattedPrice: 'R$ 109,99' },
    { id: 'pack-25600', name: '25.600 Diamantes', originalAmount: '25.600', bonusAmount: '0', totalAmount: '25.600', price: 174.99, formattedPrice: 'R$ 174,99' },
    { id: 'pack-29900', name: '29.900 Diamantes', originalAmount: '29.900', bonusAmount: '0', totalAmount: '29.900', price: 209.99, formattedPrice: 'R$ 209,99' },
];

export const specialOffers = [
    { id: 'offer-weekly-sub', name: 'Assinatura Semanal', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/rebate/0000/000/002/logo.png', price: 19.99, formattedPrice: 'R$ 19,99', originalAmount: '1.000', bonusAmount: '300', totalAmount: '1.300' },
    { id: 'offer-monthly-sub', name: 'Assinatura Mensal', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/rebate/0000/081/041/logo.png', price: 32.90, formattedPrice: 'R$ 32,90', originalAmount: '2.000', bonusAmount: '600', totalAmount: '2.600' },
    { id: 'offer-booyah-pass', name: 'Passe Booyah', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/item/0803/000/000/logo.png', price: 34.90, formattedPrice: 'R$ 34,90', originalAmount: '1.000', bonusAmount: 'Passe Booyah', totalAmount: 'Passe Booyah' },
    { id: 'offer-level-pack', name: 'Passe de Nível', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/067/rebate/0000/004/790/logo.png', price: 74.80, formattedPrice: 'R$ 74,80', originalAmount: '7.800', bonusAmount: '5.600', totalAmount: '13.400' }
];

export const upsellOffers = [
    { id: 'upsell-5600', name: '5.600 Diamantes', originalAmount: '5.600', bonusAmount: '0', totalAmount: '5.600', price: 9.90, formattedPrice: 'R$ 9,90' },
];

export const downsellOffers = [
    { id: 'downsell-bonus', name: '5.600 Diamantes +399 Bônus', originalAmount: '5.600', bonusAmount: '399', totalAmount: '5.999', price: 9.90, formattedPrice: 'R$ 9,90' },
];

export const taxOffer = [
    { id: 'tax-release', name: 'Taxa de Liberação Imediata', originalAmount: '', bonusAmount: '', totalAmount: 'Liberação', price: 9.99, formattedPrice: 'R$ 9,99' }
];

export const skinOffers = [
    { id: 'skin-itachi', name: 'Skin Itachi', price: 9.90, formattedPrice: 'R$ 9,90', image: 'https://i.ibb.co/bjfJKXvw/Screenshot-26.png' },
    { id: 'skin-madara', name: 'Skin Madara', price: 9.90, formattedPrice: 'R$ 9,90', image: 'https://i.ibb.co/gLxpsRS8/Screenshot-28.png' },
    { id: 'skin-minato', name: 'Skin Minato', price: 9.90, formattedPrice: 'R$ 9,90', image: 'https://i.ibb.co/h1ZHTHsn/Screenshot-29.png' },
    { id: 'skin-obito', name: 'Skin Obito', price: 9.90, formattedPrice: 'R$ 9,90', image: 'https://i.ibb.co/Qvp7bz7h/Screenshot-30.png' },
    { id: 'skin-orochimaru', name: 'Skin Orochimaru', price: 9.90, formattedPrice: 'R$ 9,90', image: 'https://i.ibb.co/RTnVj2SJ/Screenshot-27.png' },
];


export const paymentMethods = [
  { id: 'payment-pix', name: 'PIX', displayName: 'Pix via PagSeguro', image: 'https://cdn-gop.garenanow.com/webmain/static/payment_center/br/menu/pix_boa_mb.png', type: 'pix' },
  { id: 'payment-cc', name: 'Credit Card', displayName: 'Cartão de Crédito via PagSeguro (Aprovação, em média, imediata)', image: 'https://cdn-gop.garenanow.com/webmain/static/payment_center/br/menu/creditcard_mb.png', type: 'cc' },
  { id: 'payment-picpay', name: 'PicPay', displayName: 'PicPay via Loja dos Gamers', image: 'https://cdn-gop.garenanow.com/webmain/static/payment_center/br/menu/picpay_mb.png', type: 'pix' },
  { id: 'payment-nupay', name: 'Nupay', displayName: 'NuPay via Loja dos Gamers', image: 'https://cdn-gop.garenanow.com/webmain/static/payment_center/br/menu/br_nupay_mb.png', type: 'pix' },
  { id: 'payment-mercadopago', name: 'Mercado Pago', displayName: 'Mercado Pago', image: 'https://cdn-gop.garenanow.com/webmain/static/payment_center/mx/menu/mx_mercado_mb.png', type: 'pix' },
];

export const specialOfferItems = [
    { id: 'sombra-roxa', name: 'Sombra Roxa', price: 9.99, originalPrice: 99.99, image: 'https://i.ibb.co/DHfZ8X4T/Screenshot-35.png' },
    { id: 'barba-velho', name: 'Barba do Velho', price: 9.99, originalPrice: 99.99, image: 'https://i.ibb.co/hFdZmjZ8/Screenshot-32.png' },
    { id: 'dima-bonus', name: 'Pacote Coelhão', price: 4.99, originalPrice: 49.99, image: 'https://i.ibb.co/3m1fWyd7/Screenshot-33.png' },
    { id: 'calca-angelical', name: 'Calça Angelical Azul', price: 14.99, originalPrice: 149.90, image: 'https://i.ibb.co/qMX69Lt6/Screenshot-31.png' },
    { id: 'dunk-master', name: 'Dunk Master', price: 7.50, originalPrice: 75.90, image: 'https://i.ibb.co/RTBdyFsP/Screenshot-34.png' },
];

export const deltaForcePacks = [
    { id: 'df-pack-60', name: '60 Delta Coins', originalAmount: '60', bonusAmount: '39', totalAmount: '99', price: 5.89, formattedPrice: 'R$ 5,89' },
    { id: 'df-pack-300', name: '300 Delta Coins', originalAmount: '300', bonusAmount: '181', totalAmount: '481', price: 9.49, formattedPrice: 'R$ 9,49' },
    { id: 'df-pack-680', name: '680 Delta Coins', originalAmount: '680', bonusAmount: '307', totalAmount: '987', price: 19.90, formattedPrice: 'R$ 19,90' },
    { id: 'df-pack-1280', name: '1.280 Delta Coins', originalAmount: '1.280', bonusAmount: '1.280', totalAmount: '2.560', price: 37.99, formattedPrice: 'R$ 37,99', promo: 'COINS EM DOBRO' },
    { id: 'df-pack-3280', name: '3.280 Delta Coins', originalAmount: '3.280', bonusAmount: '3.280', totalAmount: '6.560', price: 97.99, formattedPrice: 'R$ 97,99', promo: 'COINS EM DOBRO' },
    { id: 'df-pack-6480', name: '6.480 Delta Coins', originalAmount: '6.480', bonusAmount: '2.916', totalAmount: '9.396', price: 149.90, formattedPrice: 'R$ 149,90' },
];

export const deltaForceSpecialOffers = [
  { id: 'df-offer-genesis', name: 'Black Hawk Down - Gênesis', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/151/item/0030/200/007/logo.png', price: 29.90, formattedPrice: 'R$ 29,90', originalAmount: 'Gênesis', bonusAmount: '', totalAmount: 'Gênesis' },
  { id: 'df-offer-reinvention', name: 'Black Hawk Down - Reinvenção', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/151/item/0030/200/008/logo.png', price: 14.90, formattedPrice: 'R$ 14,90', originalAmount: 'Reinvenção', bonusAmount: '', totalAmount: 'Reinvenção' },
  { id: 'df-offer-tide', name: 'Suprimentos de Maré', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/151/item/0030/200/011/logo.png', price: 5.99, formattedPrice: 'R$ 5,99', originalAmount: 'Maré', bonusAmount: '', totalAmount: 'Maré' },
  { id: 'df-offer-tide-advanced', name: 'Suprimentos de Maré - Avançado', image: 'https://cdn-gop.garenanow.com/gop/app/0000/100/151/item/0030/200/012/logo.png', price: 7.50, formattedPrice: 'R$ 7,50', originalAmount: 'Avançado', bonusAmount: '', totalAmount: 'Avançado' }
];
