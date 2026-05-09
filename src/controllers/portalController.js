'use strict';

const { getDb } = require('../database');

const portalController = {

  /* GET /api/portal/livros?q=&categoria=&autor=&disponivel= */
  searchLivros(req, res) {
    const db = getDb();
    const { q = '', categoria, autor, disponivel, page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = `WHERE 1=1`;
    const params = [];

    if (q) {
      where += ` AND (l.titulo LIKE ? OR l.isbn LIKE ? OR a.nome LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (categoria) {
      where += ` AND c.id = ?`;
      params.push(categoria);
    }
    if (autor) {
      where += ` AND a.id = ?`;
      params.push(autor);
    }

    // Base joins (without exemplares — used for COUNT)
    const joins = `
      FROM livros l
      LEFT JOIN autores a ON l.id_autor = a.id
      LEFT JOIN editoras e ON l.id_editora = e.id
      LEFT JOIN categorias c ON l.id_categoria = c.id
    `;

    const countRow = db.prepare(`SELECT COUNT(*) as total ${joins} ${where}`).get(...params);
    const total = countRow.total;

    // Main query with exemplares join for availability
    let sql = `
      SELECT l.id, l.titulo, l.isbn, l.ano_publicacao,
             (CASE WHEN l.capa_base64 IS NOT NULL OR l.capa_url IS NOT NULL THEN 1 ELSE 0 END) AS tem_capa,
             a.nome AS autor, e.nome AS editora, c.nome AS categoria,
             COUNT(ex.id) AS total_exemplares,
             SUM(CASE WHEN ex.disponivel = 1 THEN 1 ELSE 0 END) AS disponiveis
      ${joins}
      LEFT JOIN exemplares ex ON ex.id_livro = l.id
      ${where}
      GROUP BY l.id
    `;

    if (disponivel === '1' || disponivel === 'true') {
      sql += ` HAVING disponiveis > 0`;
    }

    sql += ` ORDER BY l.titulo LIMIT ? OFFSET ?`;

    const livros = db.prepare(sql).all(...params, Number(limit), offset);

    // Add capa_url pointing to the serve endpoint
    const data = livros.map(l => ({
      ...l,
      capa_url: l.tem_capa ? `/api/portal/livros/${l.id}/capa` : null,
    }));

    res.json({
      data,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  },

  /* GET /api/portal/livros/:id */
  getLivro(req, res) {
    const db = getDb();
    const livro = db.prepare(`
      SELECT l.id, l.isbn, l.titulo, l.subtitulo, l.ano_publicacao, l.edicao,
             l.num_paginas, l.idioma, l.localizacao, l.descricao,
             l.capa_url, l.capa_mime,
             (CASE WHEN l.capa_base64 IS NOT NULL OR l.capa_url IS NOT NULL THEN 1 ELSE 0 END) AS tem_capa,
             a.nome AS autor, a.bio AS biografia,
             e.nome AS editora,
             c.nome AS categoria
      FROM livros l
      LEFT JOIN autores a ON l.id_autor = a.id
      LEFT JOIN editoras e ON l.id_editora = e.id
      LEFT JOIN categorias c ON l.id_categoria = c.id
      WHERE l.id = ?
    `).get(req.params.id);

    if (!livro) return res.status(404).json({ erro: 'Livro não encontrado.' });

    const exemplares = db.prepare(`
      SELECT id, num_tombo AS codigo, disponivel, condicao FROM exemplares WHERE id_livro = ?
    `).all(req.params.id);

    // Enrich with human-readable status
    const exemplaresComStatus = exemplares.map(ex => ({
      ...ex,
      status: ex.disponivel ? 'Disponível' : 'Indisponível',
    }));

    const capaEndpoint = livro.tem_capa ? `/api/portal/livros/${livro.id}/capa` : null;

    res.json({ ...livro, capa_url: capaEndpoint, exemplares: exemplaresComStatus });
  },

  /* GET /api/portal/categorias */
  getCategorias(req, res) {
    const db = getDb();
    const cats = db.prepare('SELECT id, nome FROM categorias ORDER BY nome').all();
    res.json(cats);
  },

  /* GET /api/portal/autores */
  getAutores(req, res) {
    const db = getDb();
    const autores = db.prepare('SELECT id, nome FROM autores ORDER BY nome').all();
    res.json(autores);
  },

  /* POST /api/portal/reservas  (requer authMembro) */
  criarReserva(req, res, next) {
    try {
      const db = getDb();
      const idMembro = req.membro.id;
      const idLivro  = req.body.id_livro;

      if (!idLivro) return res.status(422).json({ erro: 'id_livro é obrigatório.' });

      // Verificar membro ativo
      const membro = db.prepare('SELECT id, ativo, data_validade FROM membros WHERE id = ?').get(idMembro);
      if (!membro || !membro.ativo) {
        return res.status(403).json({ erro: 'Cadastro de membro inativo.' });
      }
      if (membro.data_validade < new Date().toISOString().split('T')[0]) {
        return res.status(403).json({ erro: 'Cadastro de membro vencido. Renove na biblioteca.' });
      }

      // Verificar livro
      const livro = db.prepare('SELECT id, titulo FROM livros WHERE id = ?').get(idLivro);
      if (!livro) return res.status(404).json({ erro: 'Livro não encontrado.' });

      // Verificar reserva duplicada ativa
      const dup = db.prepare(`
        SELECT id FROM reservas WHERE id_membro = ? AND id_livro = ? AND status = 'Ativa'
      `).get(idMembro, idLivro);
      if (dup) return res.status(409).json({ erro: 'Você já tem uma reserva ativa para este livro.' });

      // Criar reserva
      const expiracao = new Date();
      expiracao.setDate(expiracao.getDate() + Number(process.env.DIAS_RESERVA || 3));

      const result = db.prepare(`
        INSERT INTO reservas (id_membro, id_livro, data_expiracao)
        VALUES (?, ?, ?)
      `).run(idMembro, idLivro, expiracao.toISOString().split('T')[0]);

      res.status(201).json({
        mensagem: `Reserva criada para "${livro.titulo}". Válida até ${expiracao.toISOString().split('T')[0]}.`,
        id: result.lastInsertRowid,
      });
    } catch (err) {
      next(err);
    }
  },

  /* GET /api/portal/minhas-reservas  (requer authMembro) */
  minhasReservas(req, res) {
    const db = getDb();
    const reservas = db.prepare(`
      SELECT r.*, l.titulo, l.capa_url
      FROM reservas r
      JOIN livros l ON l.id = r.id_livro
      WHERE r.id_membro = ?
      ORDER BY r.data_reserva DESC
    `).all(req.membro.id);
    res.json(reservas);
  },

  /* GET /api/portal/meu-historico  (requer authMembro) */
  meuHistorico(req, res) {
    const db = getDb();
    const emprestimos = db.prepare(`
      SELECT e.*, l.titulo, l.capa_url, ex.num_tombo AS exemplar_codigo
      FROM emprestimos e
      JOIN exemplares ex ON ex.id = e.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      WHERE e.id_membro = ?
      ORDER BY e.data_emprestimo DESC
    `).all(req.membro.id);
    res.json(emprestimos);
  },

  /* GET /api/portal/minhas-multas  (requer authMembro) */
  minhasMultas(req, res) {
    const db = getDb();
    const multas = db.prepare(`
      SELECT m.*, l.titulo, l.capa_url
      FROM multas m
      LEFT JOIN emprestimos e ON e.id = m.id_emprestimo
      LEFT JOIN exemplares ex ON ex.id = e.id_exemplar
      LEFT JOIN livros l ON l.id = ex.id_livro
      WHERE m.id_membro = ?
      ORDER BY m.created_at DESC
    `).all(req.membro.id);
    res.json(multas);
  },

  /* DELETE /api/portal/reservas/:id  (requer authMembro) */
  cancelarReserva(req, res) {
    const db = getDb();
    const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);
    if (!reserva) return res.status(404).json({ erro: 'Reserva não encontrada.' });
    if (reserva.id_membro !== req.membro.id) return res.status(403).json({ erro: 'Acesso negado.' });
    if (reserva.status !== 'Ativa') return res.status(422).json({ erro: 'Reserva não está ativa.' });

    db.prepare(`UPDATE reservas SET status = 'Cancelada' WHERE id = ?`).run(req.params.id);
    res.json({ mensagem: 'Reserva cancelada.' });
  },
};

module.exports = portalController;
