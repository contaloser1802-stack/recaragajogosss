
import { NextRequest, NextResponse } from 'next/server';

// Esta rota foi desativada e não possui mais funcionalidade.
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Funcionalidade de simulação removida.' }, { status: 404 });
}
