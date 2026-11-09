import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validarToken, COOKIE_TOKEN } from '@/lib/auth';

// Entrada do site: manda para o sistema (se autenticado) ou para o login.
export default async function Home() {
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  const sessao = await validarToken(token);
  redirect(sessao ? '/alunos' : '/login');
}
