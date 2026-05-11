'use strict';

const bcrypt = require('bcryptjs');
const { getDb } = require('./index');

async function runMigrations() {
  const knex = getDb();

  if (!(await knex.schema.hasTable('autores'))) {
    await knex.schema.createTable('autores', t => {
      t.increments('id');
      t.text('nome').notNullable();
      t.text('nacionalidade');
      t.text('bio');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('editoras'))) {
    await knex.schema.createTable('editoras', t => {
      t.increments('id');
      t.text('nome').notNullable();
      t.text('cidade');
      t.text('pais').defaultTo('Brasil');
      t.text('site');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('categorias'))) {
    await knex.schema.createTable('categorias', t => {
      t.increments('id');
      t.text('nome').notNullable().unique();
      t.text('descricao');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('livros'))) {
    await knex.schema.createTable('livros', t => {
      t.increments('id');
      t.text('isbn').unique();
      t.text('titulo').notNullable();
      t.text('subtitulo');
      t.integer('id_autor').references('id').inTable('autores').onDelete('SET NULL');
      t.integer('id_editora').references('id').inTable('editoras').onDelete('SET NULL');
      t.integer('id_categoria').references('id').inTable('categorias').onDelete('SET NULL');
      t.integer('ano_publicacao');
      t.text('edicao');
      t.integer('num_paginas');
      t.text('idioma').defaultTo('Português');
      t.text('localizacao');
      t.text('descricao');
      t.text('capa_url');
      t.text('capa_mime').defaultTo('image/jpeg');
      t.specificType('capa_base64', 'MEDIUMTEXT');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('membros'))) {
    await knex.schema.createTable('membros', t => {
      t.increments('id');
      t.text('nome').notNullable();
      t.text('cpf').notNullable().unique();
      t.text('email').unique();
      t.text('telefone');
      t.text('endereco');
      t.text('tipo').notNullable().defaultTo('Comum');
      t.date('data_cadastro').defaultTo(knex.raw('CURRENT_DATE'));
      t.date('data_validade').notNullable();
      t.integer('ativo').notNullable().defaultTo(1);
      t.text('observacoes');
      t.text('senha_hash');
      t.text('perfil');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('exemplares'))) {
    await knex.schema.createTable('exemplares', t => {
      t.increments('id');
      t.integer('id_livro').notNullable().references('id').inTable('livros').onDelete('CASCADE');
      t.text('num_tombo').notNullable().unique();
      t.text('condicao').notNullable().defaultTo('Bom');
      t.integer('disponivel').notNullable().defaultTo(1);
      t.date('data_aquisicao');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('emprestimos'))) {
    await knex.schema.createTable('emprestimos', t => {
      t.increments('id');
      t.integer('id_exemplar').notNullable().references('id').inTable('exemplares');
      t.integer('id_membro').notNullable().references('id').inTable('membros');
      t.date('data_emprestimo').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
      t.date('data_prevista_devolucao').notNullable();
      t.date('data_devolucao');
      t.integer('num_renovacoes').notNullable().defaultTo(0);
      t.text('status').notNullable().defaultTo('Ativo');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('reservas'))) {
    await knex.schema.createTable('reservas', t => {
      t.increments('id');
      t.integer('id_livro').notNullable().references('id').inTable('livros');
      t.integer('id_membro').notNullable().references('id').inTable('membros');
      t.timestamp('data_reserva').defaultTo(knex.fn.now());
      t.date('data_expiracao').notNullable();
      t.text('status').notNullable().defaultTo('Ativa');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('multas'))) {
    await knex.schema.createTable('multas', t => {
      t.increments('id');
      t.integer('id_emprestimo').notNullable().references('id').inTable('emprestimos');
      t.integer('id_membro').notNullable().references('id').inTable('membros');
      t.float('valor').notNullable();
      t.text('motivo').notNullable();
      t.date('data_geracao').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
      t.date('data_pagamento');
      t.integer('pago').notNullable().defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // Incremental migrations: add columns that may not exist in older databases
  if (!(await knex.schema.hasColumn('membros', 'senha_hash'))) {
    await knex.schema.table('membros', t => t.text('senha_hash'));
  }
  if (!(await knex.schema.hasColumn('membros', 'perfil'))) {
    await knex.schema.table('membros', t => t.text('perfil').defaultTo(null));
  }
  if (!(await knex.schema.hasColumn('livros', 'capa_mime'))) {
    await knex.schema.table('livros', t => t.text('capa_mime').defaultTo('image/jpeg'));
  }
  if (!(await knex.schema.hasColumn('livros', 'capa_base64'))) {
    await knex.schema.table('livros', t => t.specificType('capa_base64', 'MEDIUMTEXT'));
  }

  await ensureAdminUser(knex);
  console.log('✅ Migrations executadas com sucesso.');
}

/**
 * Garante que o usuário administrador padrão sempre exista no banco.
 * CPF: 101.010.101-01 | Senha: administrador123
 * Idempotente — pode rodar múltiplas vezes.
 */
async function ensureAdminUser(knex) {
  const CPF_FMT = '101.010.101-01';
  const EMAIL   = 'admin@bibliotecabrasil.local';

  // Remove legacy entry with unformatted CPF (if any)
  await knex('membros').where({ cpf: '10101010101', email: EMAIL }).delete();

  const existing = await knex('membros').where({ cpf: CPF_FMT }).first();
  if (!existing) {
    const hash = await bcrypt.hash('administrador123', 10);
    const validade = new Date();
    validade.setFullYear(validade.getFullYear() + 10);
    await knex('membros').insert({
      nome: 'Administrador',
      cpf: CPF_FMT,
      email: EMAIL,
      telefone: '',
      endereco: '',
      tipo: 'Professor',
      data_validade: validade.toISOString().split('T')[0],
      senha_hash: hash,
      perfil: 'admin',
    });
    console.log('👤 Usuário administrador padrão criado (CPF: 101.010.101-01).');
  } else {
    const updates = {};
    if (!existing.senha_hash) updates.senha_hash = await bcrypt.hash('administrador123', 10);
    if (!existing.perfil) updates.perfil = 'admin';
    if (Object.keys(updates).length) {
      await knex('membros').where({ cpf: CPF_FMT }).update(updates);
      console.log('👤 Usuário administrador padrão atualizado.');
    }
  }
}

module.exports = { runMigrations, ensureAdminUser };
