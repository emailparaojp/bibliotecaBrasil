'use strict';

const { getDb } = require('../database');

const membrosController = {
  listar(req, res) {
    const db = getDb();
    const { busca, tipo, ativo, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = [];
    let params = [];

    if (busca) {
      where.push('(m.nome LIKE ? OR m.cpf LIKE ? OR m.email LIKE ?)');
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }
    if (tipo)  { where.push('m.tipo = ?');  params.push(tipo); }
    if (ativo !== undefined) { where.push('m.ativo = ?'); params.push(ativo === '1' || ativo === 'true' ? 1 : 0); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const totalRow = db.prepare(`SELECT COUNT(*) as total FROM membros m ${whereClause}`).get(...params);
    const membros = db.prepare(`
      SELECT m.*,
             COUNT(CASE WHEN e.status IN ('Ativo', 'Atrasado') THEN 1 END) as emprestimos_ativos,
             COALESCE(SUM(CASE WHEN mu.pago = 0 THEN mu.valor ELSE 0 END), 0) as multas_pendentes
      FROM membros m
      LEFT JOIN emprestimos e  ON e.id_membro = m.id
      LEFT JOIN multas mu ON mu.id_membro = m.id
      ${whereClause}
      GROUP BY m.id ORDER BY m.nome
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    res.json({ total: totalRow.total, pagina: Number(page), limite: Number(limit), membros });
  },

  buscarPorId(req, res) {
    const db = getDb();
    const membro = db.prepare(`
      SELECT m.*,
             COALESCE(SUM(CASE WHEN mu.pago = 0 THEN mu.valor ELSE 0 END), 0) as multas_pendentes,
             date(m.data_validade) < date('now') as validade_expirada
      FROM membros m
      LEFT JOIN multas mu ON mu.id_membro = m.id
      WHERE m.id = ?
      GROUP BY m.id
    `).get(req.params.id);
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const emprestimosAtivos = db.prepare(`
      SELECT em.id, em.data_emprestimo, em.data_prevista_devolucao, em.status, em.num_renovacoes,
             l.titulo as livro_titulo, ex.num_tombo
      FROM emprestimos em
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      WHERE em.id_membro = ? AND em.status IN ('Ativo', 'Atrasado')
      ORDER BY em.data_prevista_devolucao
    `).all(membro.id);

    const reservasAtivas = db.prepare(`
      SELECT r.id, r.data_reserva, r.data_expiracao, r.status,
             l.titulo as livro_titulo, l.id as livro_id
      FROM reservas r
      JOIN livros l ON l.id = r.id_livro
      WHERE r.id_membro = ? AND r.status = 'Ativa'
    `).all(membro.id);

    res.json({ ...membro, emprestimosAtivos, reservasAtivas });
  },

  criar(req, res) {
    const db = getDb();
    const { nome, cpf, email, telefone, endereco, tipo, observacoes } = req.body;
    const diasValidade = Number(process.env.DIAS_VALIDADE_MEMBRO || 365);

    try {
      const result = db.prepare(`
        INSERT INTO membros (nome, cpf, email, telefone, endereco, tipo, data_validade, observacoes)
        VALUES (?, ?, ?, ?, ?, ?, date('now', '+' || ? || ' days'), ?)
      `).run(nome, cpf, email || null, telefone || null, endereco || null, tipo || 'Comum', diasValidade, observacoes || null);

      res.status(201).json({ id: result.lastInsertRowid, nome, cpf, tipo });
    } catch (e) {
      if (e.message.includes('UNIQUE')) return res.status(409).json({ erro: 'CPF ou e-mail já cadastrado.' });
      throw e;
    }
  },

  atualizar(req, res) {
    const db = getDb();
    const atual = db.prepare('SELECT * FROM membros WHERE id = ?').get(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const { nome, email, telefone, endereco, tipo, observacoes } = req.body;
    try {
      db.prepare(`
        UPDATE membros SET nome = ?, email = ?, telefone = ?, endereco = ?, tipo = ?, observacoes = ?
        WHERE id = ?
      `).run(nome ?? atual.nome, email ?? atual.email, telefone ?? atual.telefone,
             endereco ?? atual.endereco, tipo ?? atual.tipo, observacoes ?? atual.observacoes, req.params.id);
      res.json({ mensagem: 'Membro atualizado com sucesso.' });
    } catch (e) {
      if (e.message.includes('UNIQUE')) return res.status(409).json({ erro: 'E-mail já em uso por outro membro.' });
      throw e;
    }
  },

  renovarMatricula(req, res) {
    const db = getDb();
    const membro = db.prepare('SELECT * FROM membros WHERE id = ?').get(req.params.id);
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });
    const dias = Number(process.env.DIAS_VALIDADE_MEMBRO || 365);
    const base = new Date(membro.data_validade) > new Date() ? membro.data_validade : new Date().toISOString().split('T')[0];
    const novaValidade = new Date(new Date(base).getTime() + dias * 86400000).toISOString().split('T')[0];
    db.prepare("UPDATE membros SET data_validade = ?, ativo = 1 WHERE id = ?").run(novaValidade, req.params.id);
    res.json({ mensagem: 'Matrícula renovada.', nova_validade: novaValidade });
  },

  alterarStatus(req, res) {
    const db = getDb();
    const membro = db.prepare('SELECT * FROM membros WHERE id = ?').get(req.params.id);
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    if (req.body.ativo === false || req.body.ativo === 0) {
      const empAtivos = db.prepare("SELECT COUNT(*) as c FROM emprestimos WHERE id_membro = ? AND status IN ('Ativo', 'Atrasado')").get(req.params.id);
      if (empAtivos.c > 0) return res.status(409).json({ erro: 'Membro possui empréstimos ativos. Devolva os livros antes de inativar.' });
    }
    db.prepare('UPDATE membros SET ativo = ? WHERE id = ?').run(req.body.ativo ? 1 : 0, req.params.id);
    res.json({ mensagem: `Membro ${req.body.ativo ? 'ativado' : 'inativado'} com sucesso.` });
  },

  historico(req, res) {
    const db = getDb();
    const membro = db.prepare('SELECT id, nome FROM membros WHERE id = ?').get(req.params.id);
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const total = db.prepare('SELECT COUNT(*) as c FROM emprestimos WHERE id_membro = ?').get(membro.id).c;
    const historico = db.prepare(`
      SELECT em.id, em.data_emprestimo, em.data_prevista_devolucao, em.data_devolucao,
             em.num_renovacoes, em.status,
             l.titulo as livro_titulo, l.isbn,
             ex.num_tombo,
             mu.valor as multa_valor, mu.pago as multa_paga
      FROM emprestimos em
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      LEFT JOIN multas mu ON mu.id_emprestimo = em.id
      WHERE em.id_membro = ?
      ORDER BY em.data_emprestimo DESC
      LIMIT ? OFFSET ?
    `).all(membro.id, Number(limit), offset);

    res.json({ membro, total, pagina: Number(page), limite: Number(limit), historico });
  },
};

module.exports = membrosController;
