import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validarToken, COOKIE_TOKEN } from '@/lib/auth';

// GET /api/auth/me -> devolve o usuário do token (rota protegida pelo middleware)
export async function GET() {
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  const sessao = await validarToken(token);

  if (!sessao) {
    return NextResponse.json({ erro: 'Sessão inválida ou expirada.' }, { status: 401 });
  }

  return NextResponse.json({
    usuario: {
      id: Number(sessao.sub),
      nome: sessao.nome,
      email: sessao.email,
      papel: sessao.papel,
    },
  });
}
