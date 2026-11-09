import { NextResponse } from 'next/server';
import { validarToken, COOKIE_TOKEN } from '@/lib/auth';

// Proxy (antigo middleware) = porteiro do sistema.
// Só deixa passar quem apresenta um token de acesso válido.
// /api/auth/login fica fora do matcher para permitir o próprio login.
export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_TOKEN)?.value;

  // Precisa de await: validarToken devolve uma Promise (sempre "verdadeira").
  const sessao = await validarToken(token);

  // Rota de login: quem já está autenticado vai direto para o sistema.
  if (pathname === '/login') {
    return sessao
      ? NextResponse.redirect(new URL('/alunos', request.url))
      : NextResponse.next();
  }

  const rotaDeApi = pathname.startsWith('/api/');
  const paginaProtegida = pathname === '/alunos' || pathname.startsWith('/alunos/');

  if (!paginaProtegida && !rotaDeApi) return NextResponse.next();
  if (sessao) return NextResponse.next();

  // Token ausente, inválido ou expirado -> bloqueia o acesso.
  if (rotaDeApi) {
    return NextResponse.json(
      { erro: 'Acesso negado. Faça login para continuar.' },
      { status: 401 }
    );
  }

  const url = new URL('/login', request.url);
  url.searchParams.set('redirect', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/alunos/:path*', '/login', '/api/alunos/:path*', '/api/auth/me'],
};
