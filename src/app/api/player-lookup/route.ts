
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

<<<<<<< HEAD
const allowedOrigins = [
    'http://localhost:3000',
    'https://recargajogo.com.de',
    'https://www.recargajogo.com.de'
];

function isOriginAllowed(request: NextRequest): boolean {
    const referer = request.headers.get('referer');
    if (!referer) return false;
    return allowedOrigins.some(origin => referer.startsWith(origin));
}


export async function GET(request: NextRequest) {
  if (!isOriginAllowed(request)) {
      return NextResponse.json({ error: 'Clonou errado kk' }, { status: 403 });
  }

=======
export async function GET(request: NextRequest) {
>>>>>>> 1b9e35dbce48b3fe1b2f106a7bef016942c9168b
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ error: 'O ID do jogador é obrigatório.' }, { status: 400 });
  }

  try {
    const apiResponse = await fetch(`https://freefirefwx-beta.squareweb.app/api/info_player?uid=${uid}&region=br`);
    
    const data = await apiResponse.json();

<<<<<<< HEAD
    if (data.basicInfo && data.basicInfo.nickname) {
      return NextResponse.json({ nickname: data.basicInfo.nickname }, { status: 200 });
    } else {
=======
    // The external API returns a 200 OK status even for errors,
    // so we need to inspect the body to confirm success.
    if (data.basicInfo && data.basicInfo.nickname) {
      // Success case
      return NextResponse.json({ nickname: data.basicInfo.nickname }, { status: 200 });
    } else {
      // Error case (e.g., player not found, invalid UID)
>>>>>>> 1b9e35dbce48b3fe1b2f106a7bef016942c9168b
      return NextResponse.json({ error: data.message || 'ID de jogador não encontrado.' }, { status: 404 });
    }
  } catch (error) {
    console.error('Player lookup request failed:', error);
    return NextResponse.json({ error: 'Erro ao buscar jogador. Tente novamente.' }, { status: 500 });
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 1b9e35dbce48b3fe1b2f106a7bef016942c9168b
