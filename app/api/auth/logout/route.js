import { NextResponse } from 'next/server';
import { COOKIE_TOKEN, opcoesCookie } from '@/lib/auth';

// POST /api/auth/logout -> encerra a sessão apagando o cookie do token
export async function POST() {
  const resposta = NextResponse.json({ mensagem: 'Sessão encerrada.' });
  resposta.cookies.set(COOKIE_TOKEN, '', opcoesCookie(0));
  return resposta;
}
