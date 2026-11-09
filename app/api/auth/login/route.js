import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { buscarUsuarioPorEmail } from '@/lib/db';
import { gerarToken, COOKIE_TOKEN, opcoesCookie } from '@/lib/auth';

// POST /api/auth/login  -> autentica e devolve o token de acesso (cookie httpOnly)
export async function POST(request) {
  let dados;
  try {
    dados = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const email = String(dados?.email ?? '').trim().toLowerCase();
  const senha = String(dados?.senha ?? '');

  if (!email || !senha) {
    return NextResponse.json({ erro: 'Informe e-mail e senha.' }, { status: 400 });
  }

  const usuario = buscarUsuarioPorEmail(email);
  if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
    return NextResponse.json({ erro: 'E-mail ou senha inválidos.' }, { status: 401 });
  }

  const usuarioPublico = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
  };

  const token = await gerarToken({
    sub: String(usuario.id),
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
  });

  const resposta = NextResponse.json({ mensagem: 'Login realizado.', usuario: usuarioPublico });
  // 2 horas = mesma duração do token
  resposta.cookies.set(COOKIE_TOKEN, token, opcoesCookie(60 * 60 * 2));

  return resposta;
}
