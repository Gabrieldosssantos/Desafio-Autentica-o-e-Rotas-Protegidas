import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

// Conexão preguiçosa (lazy): o arquivo só é aberto na primeira consulta real.
// Assim o `next build` (que importa os módulos das rotas, mas não as executa)
// não tenta abrir o mesmo banco em paralelo.
let db = globalThis.__unialfaDb ?? null;

function conectar() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const conexao = new Database(path.join(dataDir, 'unialfa.db'));
  // Espera em vez de falhar se outro processo estiver escrevendo.
  conexao.pragma('busy_timeout = 15000');
  try {
    conexao.pragma('journal_mode = WAL');
  } catch {
    // Em cenários de concorrência o WAL pode não ser aplicado; seguir em frente.
  }

  conexao.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      senha      TEXT NOT NULL,
      papel      TEXT NOT NULL DEFAULT 'operador',
      criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alunos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL,
      matricula  TEXT NOT NULL UNIQUE,
      email      TEXT NOT NULL,
      curso      TEXT NOT NULL,
      periodo    INTEGER NOT NULL,
      status     TEXT NOT NULL DEFAULT 'ativo',
      criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  semearUsuarios(conexao);
  return conexao;
}

function getDb() {
  if (!db) {
    db = conectar();
    globalThis.__unialfaDb = db;
  }
  return db;
}

// Cria o usuário padrão do sistema interno caso ainda não exista.
function semearUsuarios(conexao) {
  const { total } = conexao.prepare('SELECT COUNT(*) AS total FROM usuarios').get();
  if (total > 0) return;

  const senhaHash = bcrypt.hashSync('admin123', 10);
  conexao
    .prepare('INSERT INTO usuarios (nome, email, senha, papel) VALUES (?, ?, ?, ?)')
    .run('Administrador Unialfa', 'admin@unialfa.edu.br', senhaHash, 'admin');
}

export function buscarUsuarioPorEmail(email) {
  return getDb().prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
}

export function listarAlunos({ busca = '' } = {}) {
  const base = getDb();
  if (busca) {
    const termo = `%${busca}%`;
    return base
      .prepare(
        `SELECT * FROM alunos
         WHERE nome LIKE ? OR matricula LIKE ? OR curso LIKE ? OR email LIKE ?
         ORDER BY nome COLLATE NOCASE`
      )
      .all(termo, termo, termo, termo);
  }
  return base.prepare('SELECT * FROM alunos ORDER BY nome COLLATE NOCASE').all();
}

export function buscarAluno(id) {
  return getDb().prepare('SELECT * FROM alunos WHERE id = ?').get(id);
}

export function matriculaEmUso(matricula, ignorarId = null) {
  const aluno = getDb().prepare('SELECT id FROM alunos WHERE matricula = ?').get(matricula);
  return Boolean(aluno) && aluno.id !== ignorarId;
}

export function criarAluno(aluno) {
  const info = getDb()
    .prepare(
      `INSERT INTO alunos (nome, matricula, email, curso, periodo, status)
       VALUES (@nome, @matricula, @email, @curso, @periodo, @status)`
    )
    .run(aluno);
  return buscarAluno(info.lastInsertRowid);
}

export function atualizarAluno(id, aluno) {
  getDb()
    .prepare(
      `UPDATE alunos
         SET nome = @nome,
             matricula = @matricula,
             email = @email,
             curso = @curso,
             periodo = @periodo,
             status = @status
       WHERE id = @id`
    )
    .run({ ...aluno, id });
  return buscarAluno(id);
}

export function removerAluno(id) {
  return getDb().prepare('DELETE FROM alunos WHERE id = ?').run(id).changes;
}
