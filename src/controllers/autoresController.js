'use strict';

const { getDb } = require('../database');

const autoresController = {
  listar(req, res) {
    const db = getDb();
    const { busca } = req.query;
    let rows;
    if (busca) {
      rows = db.prepare(`
        SELECT a.*, COUNT(l.id) as total_livros
        FROM autores a
        LEFT JOIN livros l ON l.id_autor = a.id
        WHERE a.nome LIKE ? OR a.nacionalidade LIKE ?
        GROUP BY a.id ORDER BY a.nome
      `).all(`%${busca}%`, `%${busca}%`);
    } else {
      rows = db.prepare(`
        SELECT a.*, COUNT(l.id) as total_livros
        FROM autores a
        LEFT JOIN livros l ON l.id_autor = a.id
        GROUP BY a.id ORDER BY a.nome
      `).all();
    }
    res.json(rows);
  },

  buscarPorId(req, res) {
    const db = getDb();
    const autor = db.prepare('SELECT * FROM autores WHERE id = ?').get(req.params.id);
    if (!autor) return res.status(404).json({ erro: 'Autor não encontrado.' });
    const livros = db.prepare(`
      SELECT l.id, l.titulo, l.ano_publicacao, l.isbn,
             c.nome as categoria, COUNT(e.id) as total_exemplares
      FROM livros l
      LEFT JOIN categorias c ON c.id = l.id_categoria
      LEFT JOIN exemplares e ON e.id_livro = l.id
      WHERE l.id_autor = ?
      GROUP BY l.id ORDER BY l.titulo
    `).all(autor.id);
    res.json({ ...autor, livros });
  },

  criar(req, res) {
    const db = getDb();
    const { nome, nacionalidade, bio } = req.body;
    const result = db.prepare('INSERT INTO autores (nome, nacionalidade, bio) VALUES (?, ?, ?)').run(nome, nacionalidade || null, bio || null);
    res.status(201).json({ id: result.lastInsertRowid, nome, nacionalidade, bio });
  },

  atualizar(req, res) {
    const db = getDb();
    const { nome, nacionalidade, bio } = req.body;
    const atual = db.prepare('SELECT * FROM autores WHERE id = ?').get(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Autor não encontrado.' });
    db.prepare('UPDATE autores SET nome = ?, nacionalidade = ?, bio = ? WHERE id = ?')
      .run(nome ?? atual.nome, nacionalidade ?? atual.nacionalidade, bio ?? atual.bio, req.params.id);
    res.json({ mensagem: 'Autor atualizado com sucesso.' });
  },

  remover(req, res) {
    const db = getDb();
    const autor = db.prepare('SELECT * FROM autores WHERE id = ?').get(req.params.id);
    if (!autor) return res.status(404).json({ erro: 'Autor não encontrado.' });
    const livros = db.prepare('SELECT COUNT(*) as c FROM livros WHERE id_autor = ?').get(req.params.id);
    if (livros.c > 0) return res.status(409).json({ erro: 'Não é possível remover: autor possui livros cadastrados.' });
    db.prepare('DELETE FROM autores WHERE id = ?').run(req.params.id);
    res.json({ mensagem: 'Autor removido com sucesso.' });
  },
};

module.exports = autoresController;
