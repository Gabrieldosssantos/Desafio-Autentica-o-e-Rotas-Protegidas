import { NextResponse } from 'next/server';
import {
  buscarAluno,
  atualizarAluno,
  removerAluno,
  matriculaEmUso,
} from '@/lib/db';

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

// GET /api/alunos/:id
export async function GET(_request, { params }) {
  const { id } = await params;
  const aluno = buscarAluno(Number(id));
  if (!aluno) return NextResponse.json({ erro: 'Aluno não encontrado.' }, { status: 404 });
  return NextResponse.json({ aluno });
}

// PUT /api/alunos/:id -> atualiza
export async function PUT(request, { params }) {
  const { id } = await params;
  const idNum = Number(id);

  if (!buscarAluno(idNum)) {
    return NextResponse.json({ erro: 'Aluno não encontrado.' }, { status: 404 });
  }

  let dados;
  try {
    dados = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const { aluno, erros } = validar(dados);
  if (erros.length) return NextResponse.json({ erro: erros.join(' ') }, { status: 400 });

  if (matriculaEmUso(aluno.matricula, idNum)) {
    return NextResponse.json({ erro: 'Já existe um aluno com esta matrícula.' }, { status: 409 });
  }

  const atualizado = atualizarAluno(idNum, aluno);
  return NextResponse.json({ mensagem: 'Aluno atualizado.', aluno: atualizado });
}

// DELETE /api/alunos/:id -> remove
export async function DELETE(_request, { params }) {
  const { id } = await params;
  const removidos = removerAluno(Number(id));
  if (!removidos) {
    return NextResponse.json({ erro: 'Aluno não encontrado.' }, { status: 404 });
  }
  return NextResponse.json({ mensagem: 'Aluno removido.' });
}
