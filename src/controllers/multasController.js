'use strict';

const { getDb } = require('../database');

const multasController = {
  listar(req, res) {
    const db = getDb();
    const { pago, id_membro, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = [];
    let params = [];
    if (pago !== undefined) { where.push('mu.pago = ?');      params.push(pago === '1' || pago === 'true' ? 1 : 0); }
    if (id_membro)          { where.push('mu.id_membro = ?'); params.push(Number(id_membro)); }

    const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const total = db.prepare(`SELECT COUNT(*) as c FROM multas mu ${wc}`).get(...params).c;

    const multas = db.prepare(`
      SELECT mu.id, mu.valor, mu.motivo, mu.data_geracao, mu.data_pagamento, mu.pago,
             m.id as membro_id, m.nome as membro_nome,
             em.id as emprestimo_id, em.data_emprestimo, em.data_prevista_devolucao,
             l.titulo as livro_titulo
      FROM multas mu
      JOIN membros m ON m.id = mu.id_membro
      JOIN emprestimos em ON em.id = mu.id_emprestimo
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      ${wc}
      ORDER BY mu.data_geracao DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const resumo = db.prepare(`
      SELECT
        COUNT(*) as total_multas,
        SUM(CASE WHEN pago = 0 THEN valor ELSE 0 END) as total_pendente,
        SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END) as total_recebido
      FROM multas mu ${wc}
    `).get(...params);

    res.json({ ...resumo, total, pagina: Number(page), limite: Number(limit), multas });
  },

  buscarPorId(req, res) {
    const db = getDb();
    const multa = db.prepare(`
      SELECT mu.*, m.nome as membro_nome, m.email as membro_email,
             em.data_emprestimo, em.data_prevista_devolucao, em.data_devolucao,
             l.titulo as livro_titulo
      FROM multas mu
      JOIN membros m ON m.id = mu.id_membro
      JOIN emprestimos em ON em.id = mu.id_emprestimo
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      WHERE mu.id = ?
    `).get(req.params.id);
    if (!multa) return res.status(404).json({ erro: 'Multa não encontrada.' });
    res.json(multa);
  },

  registrarPagamento(req, res) {
    const db = getDb();
    const multa = db.prepare('SELECT * FROM multas WHERE id = ?').get(req.params.id);
    if (!multa) return res.status(404).json({ erro: 'Multa não encontrada.' });
    if (multa.pago) return res.status(400).json({ erro: 'Multa já foi paga.' });

    const hoje = new Date().toISOString().split('T')[0];
    db.prepare("UPDATE multas SET pago = 1, data_pagamento = ? WHERE id = ?").run(hoje, req.params.id);
    res.json({ mensagem: 'Pagamento registrado com sucesso.', data_pagamento: hoje, valor: multa.valor });
  },

  pagarTodasMembro(req, res) {
    const db = getDb();
    const membro = db.prepare('SELECT * FROM membros WHERE id = ?').get(req.params.id);
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const pendentes = db.prepare("SELECT * FROM multas WHERE id_membro = ? AND pago = 0").all(req.params.id);
    if (pendentes.length === 0) return res.status(400).json({ erro: 'Membro não possui multas pendentes.' });

    const total = pendentes.reduce((s, m) => s + m.valor, 0);
    const hoje = new Date().toISOString().split('T')[0];
    db.prepare("UPDATE multas SET pago = 1, data_pagamento = ? WHERE id_membro = ? AND pago = 0").run(hoje, req.params.id);

    res.json({ mensagem: `${pendentes.length} multa(s) quitada(s).`, total_pago: total, data_pagamento: hoje });
  },

  resumoMembro(req, res) {
    const db = getDb();
    const membro = db.prepare('SELECT id, nome FROM membros WHERE id = ?').get(req.params.id);
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const resumo = db.prepare(`
      SELECT
        COUNT(*) as total_multas,
        SUM(valor) as total_geral,
        SUM(CASE WHEN pago = 0 THEN valor ELSE 0 END) as pendente,
        SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END) as pago
      FROM multas WHERE id_membro = ?
    `).get(req.params.id);

    const multas = db.prepare(`
      SELECT mu.id, mu.valor, mu.motivo, mu.data_geracao, mu.data_pagamento, mu.pago,
             l.titulo as livro_titulo
      FROM multas mu
      JOIN emprestimos em ON em.id = mu.id_emprestimo
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      WHERE mu.id_membro = ?
      ORDER BY mu.data_geracao DESC
    `).all(req.params.id);

    res.json({ membro, ...resumo, multas });
  },
};

module.exports = multasController;
