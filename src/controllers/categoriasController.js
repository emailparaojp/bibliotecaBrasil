'use strict';

const { getDb } = require('../database');

function rows(r) { return Array.isArray(r) ? r : (r.rows || []); }
function row(r)  { return rows(r)[0] ?? null; }

const categoriasController = {
  async listar(req, res) {
    const knex = getDb();
    const result = await knex.raw(`
      SELECT c.*, COUNT(l.id) as total_livros
      FROM categorias c
      LEFT JOIN livros l ON l.id_categoria = c.id
      GROUP BY c.id ORDER BY c.nome
    `);
    res.json(rows(result));
  },

  async buscarPorId(req, res) {
    const knex = getDb();
    const cat = row(await knex.raw('SELECT * FROM categorias WHERE id = ?', [req.params.id]));
    if (!cat) return res.status(404).json({ erro: 'Categoria não encontrada.' });
    const livros = rows(await knex.raw(`
      SELECT l.id, l.titulo, l.isbn, a.nome as autor, l.ano_publicacao
      FROM livros l
      LEFT JOIN autores a ON a.id = l.id_autor
      WHERE l.id_categoria = ?
      ORDER BY l.titulo
    `, [cat.id]));
    res.json({ ...cat, livros });
  },

  async criar(req, res) {
    const knex = getDb();
    const { nome, descricao } = req.body;
    try {
      const result = await knex('categorias').insert({ nome, descricao: descricao || null }).returning('id');
      const id = typeof result[0] === 'object' ? result[0].id : result[0];
      res.status(201).json({ id, nome, descricao });
    } catch (e) {
      if (e.message.includes('UNIQUE') || e.message.includes('unique')) return res.status(409).json({ erro: 'Categoria já cadastrada.' });
      throw e;
    }
  },

  async atualizar(req, res) {
    const knex = getDb();
    const { nome, descricao } = req.body;
    const atual = row(await knex.raw('SELECT * FROM categorias WHERE id = ?', [req.params.id]));
    if (!atual) return res.status(404).json({ erro: 'Categoria não encontrada.' });
    try {
      await knex('categorias').where({ id: req.params.id }).update({
        nome:     nome     ?? atual.nome,
        descricao: descricao ?? atual.descricao,
      });
      res.json({ mensagem: 'Categoria atualizada com sucesso.' });
    } catch (e) {
      if (e.message.includes('UNIQUE') || e.message.includes('unique')) return res.status(409).json({ erro: 'Já existe uma categoria com esse nome.' });
      throw e;
    }
  },

  async remover(req, res) {
    const knex = getDb();
    const cat = row(await knex.raw('SELECT * FROM categorias WHERE id = ?', [req.params.id]));
    if (!cat) return res.status(404).json({ erro: 'Categoria não encontrada.' });
    const { c } = await knex('livros').where({ id_categoria: req.params.id }).count('id as c').first();
    if (Number(c) > 0) return res.status(409).json({ erro: 'Não é possível remover: categoria possui livros cadastrados.' });
    await knex('categorias').where({ id: req.params.id }).delete();
    res.json({ mensagem: 'Categoria removida com sucesso.' });
  },
};

module.exports = categoriasController;
