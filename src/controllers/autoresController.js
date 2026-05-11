'use strict';

const { getDb } = require('../database');
const { rows, row } = require('../database/helpers');

const autoresController = {
  async listar(req, res) {
    const knex = getDb();
    const { busca } = req.query;
    let result;
    if (busca) {
      result = await knex.raw(`
        SELECT a.*, COUNT(l.id) as total_livros
        FROM autores a
        LEFT JOIN livros l ON l.id_autor = a.id
        WHERE a.nome LIKE ? OR a.nacionalidade LIKE ?
        GROUP BY a.id ORDER BY a.nome
      `, [`%${busca}%`, `%${busca}%`]);
    } else {
      result = await knex.raw(`
        SELECT a.*, COUNT(l.id) as total_livros
        FROM autores a
        LEFT JOIN livros l ON l.id_autor = a.id
        GROUP BY a.id ORDER BY a.nome
      `);
    }
    res.json(rows(result));
  },

  async buscarPorId(req, res) {
    const knex = getDb();
    const autor = row(await knex.raw('SELECT * FROM autores WHERE id = ?', [req.params.id]));
    if (!autor) return res.status(404).json({ erro: 'Autor não encontrado.' });
    const livros = rows(await knex.raw(`
      SELECT l.id, l.titulo, l.ano_publicacao, l.isbn,
             c.nome as categoria, COUNT(e.id) as total_exemplares
      FROM livros l
      LEFT JOIN categorias c ON c.id = l.id_categoria
      LEFT JOIN exemplares e ON e.id_livro = l.id
      WHERE l.id_autor = ?
      GROUP BY l.id, c.nome ORDER BY l.titulo
    `, [autor.id]));
    res.json({ ...autor, livros });
  },

  async criar(req, res) {
    const knex = getDb();
    const { nome, nacionalidade, bio } = req.body;
    const result = await knex('autores').insert({ nome, nacionalidade: nacionalidade || null, bio: bio || null }).returning('id');
    const id = typeof result[0] === 'object' ? result[0].id : result[0];
    res.status(201).json({ id, nome, nacionalidade, bio });
  },

  async atualizar(req, res) {
    const knex = getDb();
    const { nome, nacionalidade, bio } = req.body;
    const atual = row(await knex.raw('SELECT * FROM autores WHERE id = ?', [req.params.id]));
    if (!atual) return res.status(404).json({ erro: 'Autor não encontrado.' });
    await knex('autores').where({ id: req.params.id }).update({
      nome:          nome          ?? atual.nome,
      nacionalidade: nacionalidade ?? atual.nacionalidade,
      bio:           bio           ?? atual.bio,
    });
    res.json({ mensagem: 'Autor atualizado com sucesso.' });
  },

  async remover(req, res) {
    const knex = getDb();
    const autor = row(await knex.raw('SELECT * FROM autores WHERE id = ?', [req.params.id]));
    if (!autor) return res.status(404).json({ erro: 'Autor não encontrado.' });
    const { c } = await knex('livros').where({ id_autor: req.params.id }).count('id as c').first();
    if (Number(c) > 0) return res.status(409).json({ erro: 'Não é possível remover: autor possui livros cadastrados.' });
    await knex('autores').where({ id: req.params.id }).delete();
    res.json({ mensagem: 'Autor removido com sucesso.' });
  },
};

module.exports = autoresController;
