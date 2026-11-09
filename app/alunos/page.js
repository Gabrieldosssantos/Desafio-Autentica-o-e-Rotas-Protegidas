'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const FORMULARIO_VAZIO = {
  nome: '',
  matricula: '',
  email: '',
  curso: '',
  periodo: '1',
  status: 'ativo',
};

export default function PaginaAlunos() {
  const router = useRouter();

  const [alunos, setAlunos] = useState([]);
  const [busca, setBusca] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Sessão expirada/inválida -> volta para o login.
  const tratarNaoAutenticado = useCallback(() => {
    router.replace('/login');
  }, [router]);

  const carregarAlunos = useCallback(
    async (termo = '') => {
      setCarregando(true);
      try {
        const url = termo ? `/api/alunos?busca=${encodeURIComponent(termo)}` : '/api/alunos';
        const resposta = await fetch(url, { cache: 'no-store' });

        if (resposta.status === 401) return tratarNaoAutenticado();

        const dados = await resposta.json();
        setAlunos(dados.alunos ?? []);
      } catch {
        setErro('Não foi possível carregar a lista de alunos.');
      } finally {
        setCarregando(false);
      }
    },
    [tratarNaoAutenticado]
  );

  useEffect(() => {
    (async () => {
      const resposta = await fetch('/api/auth/me', { cache: 'no-store' });
      if (resposta.status === 401) return tratarNaoAutenticado();
      const dados = await resposta.json();
      setUsuario(dados.usuario);
    })();
    carregarAlunos();
  }, [carregarAlunos, tratarNaoAutenticado]);

  function limparMensagens() {
    setErro('');
    setAviso('');
  }

  function aoDigitar(evento) {
    const { name, value } = evento.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
  }

  function editar(aluno) {
    limparMensagens();
    setEditandoId(aluno.id);
    setFormulario({
      nome: aluno.nome,
      matricula: aluno.matricula,
      email: aluno.email,
      curso: aluno.curso,
      periodo: String(aluno.periodo),
      status: aluno.status,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setFormulario(FORMULARIO_VAZIO);
    limparMensagens();
  }

  async function salvar(evento) {
    evento.preventDefault();
    limparMensagens();
    setSalvando(true);

    const editando = editandoId !== null;
    const url = editando ? `/api/alunos/${editandoId}` : '/api/alunos';
    const metodo = editando ? 'PUT' : 'POST';

    try {
      const resposta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formulario, periodo: Number(formulario.periodo) }),
      });

      if (resposta.status === 401) return tratarNaoAutenticado();

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados?.erro ?? 'Não foi possível salvar o aluno.');
        return;
      }

      setAviso(editando ? 'Aluno atualizado com sucesso.' : 'Aluno cadastrado com sucesso.');
      cancelarEdicao();
      await carregarAlunos(busca);
    } catch {
      setErro('Falha de comunicação com o servidor.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(aluno) {
    if (!window.confirm(`Remover o aluno "${aluno.nome}"?`)) return;
    limparMensagens();

    try {
      const resposta = await fetch(`/api/alunos/${aluno.id}`, { method: 'DELETE' });

      if (resposta.status === 401) return tratarNaoAutenticado();

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados?.erro ?? 'Não foi possível remover o aluno.');
        return;
      }

      setAviso('Aluno removido com sucesso.');
      if (editandoId === aluno.id) cancelarEdicao();
      await carregarAlunos(busca);
    } catch {
      setErro('Falha de comunicação com o servidor.');
    }
  }

  async function pesquisar(evento) {
    evento.preventDefault();
    limparMensagens();
    await carregarAlunos(busca);
  }

  async function sair() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <>
      <header className="topo">
        <h1>Unialfa · Cadastro de Alunos</h1>
        <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {usuario && (
            <span className="usuario">
              {usuario.nome} ({usuario.papel})
            </span>
          )}
          <button className="btn btn-neutro btn-mini" onClick={sair} type="button">
            Sair
          </button>
        </div>
      </header>

      <main className="conteudo">
        {erro && <div className="aviso aviso-erro">{erro}</div>}
        {aviso && <div className="aviso aviso-ok">{aviso}</div>}

        {/* Formulário de cadastro / edição */}
        <section className="painel">
          <h2>{editandoId !== null ? `Editar aluno #${editandoId}` : 'Novo aluno'}</h2>

          <form onSubmit={salvar}>
            <div className="linha">
              <label className="campo">
                <span>Nome completo</span>
                <input name="nome" value={formulario.nome} onChange={aoDigitar} required />
              </label>

              <label className="campo">
                <span>Matrícula</span>
                <input name="matricula" value={formulario.matricula} onChange={aoDigitar} required />
              </label>

              <label className="campo">
                <span>E-mail</span>
                <input type="email" name="email" value={formulario.email} onChange={aoDigitar} required />
              </label>
            </div>

            <div className="linha" style={{ marginTop: 16 }}>
              <label className="campo">
                <span>Curso</span>
                <input name="curso" value={formulario.curso} onChange={aoDigitar} required />
              </label>

              <label className="campo">
                <span>Período</span>
                <select name="periodo" value={formulario.periodo} onChange={aoDigitar}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}º período
                    </option>
                  ))}
                </select>
              </label>

              <label className="campo">
                <span>Situação</span>
                <select name="status" value={formulario.status} onChange={aoDigitar}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </label>

              <div className="acoes">
                <button className="btn btn-primario" type="submit" disabled={salvando}>
                  {salvando ? 'Salvando...' : editandoId !== null ? 'Atualizar' : 'Cadastrar'}
                </button>
                {editandoId !== null && (
                  <button className="btn btn-neutro" type="button" onClick={cancelarEdicao}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>

        {/* Busca + listagem */}
        <section className="painel">
          <form className="linha" onSubmit={pesquisar} style={{ marginBottom: 16 }}>
            <label className="campo">
              <span>Buscar por nome, matrícula, curso ou e-mail</span>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Ex.: Administração"
              />
            </label>
            <div className="acoes">
              <button className="btn btn-primario" type="submit">
                Buscar
              </button>
              <button
                className="btn btn-neutro"
                type="button"
                onClick={() => {
                  setBusca('');
                  carregarAlunos('');
                }}
              >
                Limpar
              </button>
            </div>
          </form>

          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Matrícula</th>
                  <th>Curso</th>
                  <th>Período</th>
                  <th>E-mail</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td className="vazio" colSpan={8}>
                      Carregando...
                    </td>
                  </tr>
                ) : alunos.length === 0 ? (
                  <tr>
                    <td className="vazio" colSpan={8}>
                      Nenhum aluno encontrado.
                    </td>
                  </tr>
                ) : (
                  alunos.map((aluno) => (
                    <tr key={aluno.id}>
                      <td>{aluno.id}</td>
                      <td>{aluno.nome}</td>
                      <td>{aluno.matricula}</td>
                      <td>{aluno.curso}</td>
                      <td>{aluno.periodo}º</td>
                      <td>{aluno.email}</td>
                      <td>
                        <span className={`badge badge-${aluno.status}`}>{aluno.status}</span>
                      </td>
                      <td>
                        <div className="acoes">
                          <button className="btn btn-neutro btn-mini" onClick={() => editar(aluno)}>
                            Editar
                          </button>
                          <button className="btn btn-perigo btn-mini" onClick={() => excluir(aluno)}>
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
