'use strict';

const { getDb } = require('../database');

const editorasController = {
  listar(req, res) {
    const db = getDb();
    const rows = db.prepare(`
      SELECT ed.*, COUNT(l.id) as total_livros
      FROM editoras ed
      LEFT JOIN livros l ON l.id_editora = ed.id
      GROUP BY ed.id ORDER BY ed.nome
    `).all();
    res.json(rows);
  },

  buscarPorId(req, res) {
    const db = getDb();
    const editora = db.prepare('SELECT * FROM editoras WHERE id = ?').get(req.params.id);
    if (!editora) return res.status(404).json({ erro: 'Editora não encontrada.' });
    const livros = db.prepare(`
      SELECT l.id, l.titulo, l.isbn, l.ano_publicacao,
             a.nome as autor, c.nome as categoria
      FROM livros l
      LEFT JOIN autores a ON a.id = l.id_autor
      LEFT JOIN categorias c ON c.id = l.id_categoria
      WHERE l.id_editora = ?
      ORDER BY l.titulo
    `).all(editora.id);
    res.json({ ...editora, livros });
  },

  criar(req, res) {
    const db = getDb();
    const { nome, cidade, pais, site } = req.body;
    const result = db.prepare('INSERT INTO editoras (nome, cidade, pais, site) VALUES (?, ?, ?, ?)')
      .run(nome, cidade || null, pais || 'Brasil', site || null);
    res.status(201).json({ id: result.lastInsertRowid, nome, cidade, pais, site });
  },

  atualizar(req, res) {
    const db = getDb();
    const { nome, cidade, pais, site } = req.body;
    const atual = db.prepare('SELECT * FROM editoras WHERE id = ?').get(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Editora não encontrada.' });
    db.prepare('UPDATE editoras SET nome = ?, cidade = ?, pais = ?, site = ? WHERE id = ?')
      .run(nome ?? atual.nome, cidade ?? atual.cidade, pais ?? atual.pais, site ?? atual.site, req.params.id);
    res.json({ mensagem: 'Editora atualizada com sucesso.' });
  },

  remover(req, res) {
    const db = getDb();
    const editora = db.prepare('SELECT * FROM editoras WHERE id = ?').get(req.params.id);
    if (!editora) return res.status(404).json({ erro: 'Editora não encontrada.' });
    const livros = db.prepare('SELECT COUNT(*) as c FROM livros WHERE id_editora = ?').get(req.params.id);
    if (livros.c > 0) return res.status(409).json({ erro: 'Não é possível remover: editora possui livros cadastrados.' });
    db.prepare('DELETE FROM editoras WHERE id = ?').run(req.params.id);
    res.json({ mensagem: 'Editora removida com sucesso.' });
  },
};

module.exports = editorasController;
