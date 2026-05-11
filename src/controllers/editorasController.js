'use strict';

const { getDb } = require('../database');

function rows(r) { return Array.isArray(r) ? r : (r.rows || []); }
function row(r)  { return rows(r)[0] ?? null; }

const editorasController = {
  async listar(req, res) {
    const knex = getDb();
    const result = await knex.raw(`
      SELECT ed.*, COUNT(l.id) as total_livros
      FROM editoras ed
      LEFT JOIN livros l ON l.id_editora = ed.id
      GROUP BY ed.id ORDER BY ed.nome
    `);
    res.json(rows(result));
  },

  async buscarPorId(req, res) {
    const knex = getDb();
    const editora = row(await knex.raw('SELECT * FROM editoras WHERE id = ?', [req.params.id]));
    if (!editora) return res.status(404).json({ erro: 'Editora não encontrada.' });
    const livros = rows(await knex.raw(`
      SELECT l.id, l.titulo, l.isbn, l.ano_publicacao,
             a.nome as autor, c.nome as categoria
      FROM livros l
      LEFT JOIN autores a ON a.id = l.id_autor
      LEFT JOIN categorias c ON c.id = l.id_categoria
      WHERE l.id_editora = ?
      ORDER BY l.titulo
    `, [editora.id]));
    res.json({ ...editora, livros });
  },

  async criar(req, res) {
    const knex = getDb();
    const { nome, cidade, pais, site } = req.body;
    const result = await knex('editoras').insert({
      nome,
      cidade: cidade || null,
      pais:   pais   || 'Brasil',
      site:   site   || null,
    }).returning('id');
    const id = typeof result[0] === 'object' ? result[0].id : result[0];
    res.status(201).json({ id, nome, cidade, pais, site });
  },

  async atualizar(req, res) {
    const knex = getDb();
    const { nome, cidade, pais, site } = req.body;
    const atual = row(await knex.raw('SELECT * FROM editoras WHERE id = ?', [req.params.id]));
    if (!atual) return res.status(404).json({ erro: 'Editora não encontrada.' });
    await knex('editoras').where({ id: req.params.id }).update({
      nome:   nome   ?? atual.nome,
      cidade: cidade ?? atual.cidade,
      pais:   pais   ?? atual.pais,
      site:   site   ?? atual.site,
    });
    res.json({ mensagem: 'Editora atualizada com sucesso.' });
  },

  async remover(req, res) {
    const knex = getDb();
    const editora = row(await knex.raw('SELECT * FROM editoras WHERE id = ?', [req.params.id]));
    if (!editora) return res.status(404).json({ erro: 'Editora não encontrada.' });
    const { c } = await knex('livros').where({ id_editora: req.params.id }).count('id as c').first();
    if (Number(c) > 0) return res.status(409).json({ erro: 'Não é possível remover: editora possui livros cadastrados.' });
    await knex('editoras').where({ id: req.params.id }).delete();
    res.json({ mensagem: 'Editora removida com sucesso.' });
  },
};

module.exports = editorasController;
