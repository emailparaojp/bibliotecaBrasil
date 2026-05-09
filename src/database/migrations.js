'use strict';

const bcrypt = require('bcryptjs');
const { getDb } = require('./index');

function runMigrations() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS autores (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL,
      nacionalidade TEXT,
      bio        TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS editoras (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL,
      cidade     TEXT,
      pais       TEXT DEFAULT 'Brasil',
      site       TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL UNIQUE,
      descricao  TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS livros (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn            TEXT UNIQUE,
      titulo          TEXT NOT NULL,
      subtitulo       TEXT,
      id_autor        INTEGER REFERENCES autores(id) ON DELETE SET NULL,
      id_editora      INTEGER REFERENCES editoras(id) ON DELETE SET NULL,
      id_categoria    INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
      ano_publicacao  INTEGER,
      edicao          TEXT,
      num_paginas     INTEGER,
      idioma          TEXT DEFAULT 'Português',
      localizacao     TEXT,
      descricao       TEXT,
      capa_url        TEXT,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exemplares (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      id_livro        INTEGER NOT NULL REFERENCES livros(id) ON DELETE CASCADE,
      num_tombo       TEXT NOT NULL UNIQUE,
      condicao        TEXT NOT NULL DEFAULT 'Bom'
                        CHECK(condicao IN ('Novo', 'Bom', 'Regular', 'Ruim')),
      disponivel      INTEGER NOT NULL DEFAULT 1,
      data_aquisicao  DATE,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS membros (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nome            TEXT NOT NULL,
      cpf             TEXT NOT NULL UNIQUE,
      email           TEXT UNIQUE,
      telefone        TEXT,
      endereco        TEXT,
      tipo            TEXT NOT NULL DEFAULT 'Comum'
                        CHECK(tipo IN ('Estudante', 'Professor', 'Comum')),
      data_cadastro   DATE DEFAULT (date('now')),
      data_validade   DATE NOT NULL,
      ativo           INTEGER NOT NULL DEFAULT 1,
      observacoes     TEXT,
      senha_hash      TEXT,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS emprestimos (
      id                       INTEGER PRIMARY KEY AUTOINCREMENT,
      id_exemplar              INTEGER NOT NULL REFERENCES exemplares(id),
      id_membro                INTEGER NOT NULL REFERENCES membros(id),
      data_emprestimo          DATE NOT NULL DEFAULT (date('now')),
      data_prevista_devolucao  DATE NOT NULL,
      data_devolucao           DATE,
      num_renovacoes           INTEGER NOT NULL DEFAULT 0,
      status                   TEXT NOT NULL DEFAULT 'Ativo'
                                 CHECK(status IN ('Ativo', 'Devolvido', 'Atrasado', 'Renovado')),
      created_at               DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reservas (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      id_livro        INTEGER NOT NULL REFERENCES livros(id),
      id_membro       INTEGER NOT NULL REFERENCES membros(id),
      data_reserva    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      data_expiracao  DATE NOT NULL,
      status          TEXT NOT NULL DEFAULT 'Ativa'
                        CHECK(status IN ('Ativa', 'Cancelada', 'Expirada', 'Concluida')),
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS multas (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      id_emprestimo   INTEGER NOT NULL REFERENCES emprestimos(id),
      id_membro       INTEGER NOT NULL REFERENCES membros(id),
      valor           REAL NOT NULL,
      motivo          TEXT NOT NULL,
      data_geracao    DATE NOT NULL DEFAULT (date('now')),
      data_pagamento  DATE,
      pago            INTEGER NOT NULL DEFAULT 0,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_livros_titulo      ON livros(titulo);
    CREATE INDEX IF NOT EXISTS idx_livros_isbn        ON livros(isbn);
    CREATE INDEX IF NOT EXISTS idx_livros_autor       ON livros(id_autor);
    CREATE INDEX IF NOT EXISTS idx_livros_categoria   ON livros(id_categoria);
    CREATE INDEX IF NOT EXISTS idx_exemplares_livro   ON exemplares(id_livro);
    CREATE INDEX IF NOT EXISTS idx_exemplares_disp    ON exemplares(disponivel);
    CREATE INDEX IF NOT EXISTS idx_emprestimos_membro ON emprestimos(id_membro);
    CREATE INDEX IF NOT EXISTS idx_emprestimos_status ON emprestimos(status);
    CREATE INDEX IF NOT EXISTS idx_reservas_membro    ON reservas(id_membro);
    CREATE INDEX IF NOT EXISTS idx_reservas_livro     ON reservas(id_livro);
    CREATE INDEX IF NOT EXISTS idx_multas_membro      ON multas(id_membro);
    CREATE INDEX IF NOT EXISTS idx_multas_pago        ON multas(pago);
  `);

  // Migração incremental: adiciona colunas que podem não existir em bancos antigos
  const cols = db.prepare("PRAGMA table_info(membros)").all().map(c => c.name);
  if (!cols.includes('senha_hash')) {
    db.exec('ALTER TABLE membros ADD COLUMN senha_hash TEXT');
  }
  if (!cols.includes('perfil')) {
    db.exec("ALTER TABLE membros ADD COLUMN perfil TEXT DEFAULT NULL");
  }

  const livrosCols = db.prepare("PRAGMA table_info(livros)").all().map(c => c.name);
  if (!livrosCols.includes('capa_mime')) {
    db.exec('ALTER TABLE livros ADD COLUMN capa_mime TEXT DEFAULT \'image/jpeg\'');
  }
  if (!livrosCols.includes('capa_base64')) {
    db.exec('ALTER TABLE livros ADD COLUMN capa_base64 TEXT');
  }

  ensureAdminUser(db);

  console.log('✅ Migrations executadas com sucesso.');
}

/**
 * Garante que o usuário administrador padrão sempre exista no banco.
 * CPF: 101.010.101-01 | Senha: administrador123
 * Idempotente — pode rodar múltiplas vezes.
 */
function ensureAdminUser(db) {
  const CPF_FMT = '101.010.101-01';
  const EMAIL   = 'admin@bibliotecabrasil.local';

  // Remove entrada legada com CPF sem formatação (se existir)
  db.prepare("DELETE FROM membros WHERE cpf = '10101010101' AND email = ?").run(EMAIL);

  const existing = db.prepare('SELECT id, senha_hash, perfil FROM membros WHERE cpf = ?').get(CPF_FMT);
  if (!existing) {
    const hash = bcrypt.hashSync('administrador123', 10);
    db.prepare(`
      INSERT INTO membros (nome, cpf, email, telefone, endereco, tipo, data_validade, senha_hash, perfil)
      VALUES (?, ?, ?, ?, ?, ?, date('now', '+10 years'), ?, ?)
    `).run('Administrador', CPF_FMT, EMAIL, '', '', 'Professor', hash, 'admin');
    console.log('👤 Usuário administrador padrão criado (CPF: 101.010.101-01).');
  } else {
    const updates = [];
    const params = [];
    if (!existing.senha_hash) {
      updates.push('senha_hash = ?');
      params.push(bcrypt.hashSync('administrador123', 10));
    }
    if (!existing.perfil) {
      updates.push('perfil = ?');
      params.push('admin');
    }
    if (updates.length) {
      params.push(CPF_FMT);
      db.prepare(`UPDATE membros SET ${updates.join(', ')} WHERE cpf = ?`).run(...params);
      console.log('👤 Usuário administrador padrão atualizado.');
    }
  }
}

module.exports = { runMigrations, ensureAdminUser };
