'use strict';

const { getDb } = require('../database');

const categoriasController = {
  listar(req, res) {
    const db = getDb();
    const rows = db.prepare(`
      SELECT c.*, COUNT(l.id) as total_livros
      FROM categorias c
      LEFT JOIN livros l ON l.id_categoria = c.id
      GROUP BY c.id ORDER BY c.nome
    `).all();
    res.json(rows);
  },

  buscarPorId(req, res) {
    const db = getDb();
    const cat = db.prepare('SELECT * FROM categorias WHERE id = ?').get(req.params.id);
    if (!cat) return res.status(404).json({ erro: 'Categoria não encontrada.' });
    const livros = db.prepare(`
      SELECT l.id, l.titulo, l.isbn, a.nome as autor, l.ano_publicacao
      FROM livros l
      LEFT JOIN autores a ON a.id = l.id_autor
      WHERE l.id_categoria = ?
      ORDER BY l.titulo
    `).all(cat.id);
    res.json({ ...cat, livros });
  },

  criar(req, res) {
    const db = getDb();
    const { nome, descricao } = req.body;
    try {
      const result = db.prepare('INSERT INTO categorias (nome, descricao) VALUES (?, ?)').run(nome, descricao || null);
      res.status(201).json({ id: result.lastInsertRowid, nome, descricao });
    } catch (e) {
      if (e.message.includes('UNIQUE')) return res.status(409).json({ erro: 'Categoria já cadastrada.' });
      throw e;
    }
  },

  atualizar(req, res) {
    const db = getDb();
    const { nome, descricao } = req.body;
    const atual = db.prepare('SELECT * FROM categorias WHERE id = ?').get(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Categoria não encontrada.' });
    try {
      db.prepare('UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?')
        .run(nome ?? atual.nome, descricao ?? atual.descricao, req.params.id);
      res.json({ mensagem: 'Categoria atualizada com sucesso.' });
    } catch (e) {
      if (e.message.includes('UNIQUE')) return res.status(409).json({ erro: 'Já existe uma categoria com esse nome.' });
      throw e;
    }
  },

  remover(req, res) {
    const db = getDb();
    const cat = db.prepare('SELECT * FROM categorias WHERE id = ?').get(req.params.id);
    if (!cat) return res.status(404).json({ erro: 'Categoria não encontrada.' });
    const livros = db.prepare('SELECT COUNT(*) as c FROM livros WHERE id_categoria = ?').get(req.params.id);
    if (livros.c > 0) return res.status(409).json({ erro: 'Não é possível remover: categoria possui livros cadastrados.' });
    db.prepare('DELETE FROM categorias WHERE id = ?').run(req.params.id);
    res.json({ mensagem: 'Categoria removida com sucesso.' });
  },
};

module.exports = categoriasController;
