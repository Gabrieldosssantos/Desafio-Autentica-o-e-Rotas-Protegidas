import { NextResponse } from 'next/server';
import { listarAlunos, criarAluno, matriculaEmUso } from '@/lib/db';

// Normaliza e valida os dados vindos do cliente.
function validar(dados) {
  const aluno = {
    nome: String(dados?.nome ?? '').trim(),
    matricula: String(dados?.matricula ?? '').trim(),
    email: String(dados?.email ?? '').trim().toLowerCase(),
    curso: String(dados?.curso ?? '').trim(),
    periodo: Number.parseInt(dados?.periodo, 10),
    status: dados?.status === 'inativo' ? 'inativo' : 'ativo',
  };

  const erros = [];
  if (!aluno.nome) erros.push('O nome é obrigatório.');
  if (!aluno.matricula) erros.push('A matrícula é obrigatória.');
  if (!aluno.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(aluno.email))
    erros.push('Informe um e-mail válido.');
  if (!aluno.curso) erros.push('O curso é obrigatório.');
  if (!Number.isInteger(aluno.periodo) || aluno.periodo < 1 || aluno.periodo > 10)
    erros.push('O período deve ser um número entre 1 e 10.');

  return { aluno, erros };
}

// GET /api/alunos -> lista alunos (aceita ?busca=)
export async function GET(request) {
  const busca = request.nextUrl.searchParams.get('busca') ?? '';
  return NextResponse.json({ alunos: listarAlunos({ busca }) });
}

// POST /api/alunos -> cadastra um aluno
export async function POST(request) {
  let dados;
  try {
    dados = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const { aluno, erros } = validar(dados);
  if (erros.length) return NextResponse.json({ erro: erros.join(' ') }, { status: 400 });

  if (matriculaEmUso(aluno.matricula)) {
    return NextResponse.json({ erro: 'Já existe um aluno com esta matrícula.' }, { status: 409 });
  }

  const criado = criarAluno(aluno);
  return NextResponse.json({ mensagem: 'Aluno cadastrado.', aluno: criado }, { status: 201 });
}
