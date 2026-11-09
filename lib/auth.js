import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_TOKEN = 'unialfa_token';

const segredo = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-inseguro-troque-isto'
);

// Tempo de vida do token de acesso (string aceita pelo jose: 2h, 30m, 7d...).
export const EXPIRACAO_TOKEN = '2h';

// O cookie só deve ser marcado como Secure quando o site roda em HTTPS.
// Em HTTP local (npm run dev / npm start) precisa ser false, senão o
// navegador não envia o cookie de volta e toda rota protegida retorna 401.
export const COOKIE_SEGURO = process.env.COOKIE_SECURE === 'true';

// Opções padrão do cookie que guarda o token de acesso.
export function opcoesCookie(maxAge) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SEGURO,
    path: '/',
    maxAge,
  };
}

/** Gera um token de acesso (JWT) assinado com HS256. */
export async function gerarToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRACAO_TOKEN)
    .sign(segredo);
}

/**
 * Valida o token de acesso.
 * Retorna o payload quando o token é válido, ou null quando é inválido/expirado.
 * (Sem dependência do runtime do Next, por isso também funciona no middleware.)
 */
export async function validarToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, segredo);
    return payload;
  } catch {
    return null;
  }
}
