'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function FormularioLogin() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const resposta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados?.erro ?? 'Não foi possível entrar.');
        return;
      }

      const destino = parametros.get('redirect') || '/alunos';
      router.replace(destino);
      router.refresh();
    } catch {
      setErro('Falha de comunicação com o servidor.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="tela-login">
      <form className="cartao-login" onSubmit={enviar}>
        <div className="marca">
          <h1>Unialfa · Sistema Interno</h1>
          <p>Área restrita a pessoas autorizadas</p>
        </div>

        {erro && <div className="aviso aviso-erro">{erro}</div>}

        <label className="campo">
          <span>E-mail institucional</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@unialfa.edu.br"
            autoComplete="username"
            required
          />
        </label>

        <label className="campo">
          <span>Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </label>

        <button className="btn btn-primario btn-bloco" type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function PaginaLogin() {
  return (
    <Suspense fallback={<div className="tela-login" />}>
      <FormularioLogin />
    </Suspense>
  );
}
