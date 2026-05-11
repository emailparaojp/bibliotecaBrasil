'use strict';

const { getDb } = require('../database');

function rows(r) { return Array.isArray(r) ? r : (r.rows || []); }
function row(r)  { return rows(r)[0] ?? null; }

const multasController = {
  async listar(req, res) {
    const knex = getDb();
    const { pago, id_membro, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = [];
    let params = [];
    if (pago !== undefined) { where.push('mu.pago = ?');      params.push(pago === '1' || pago === 'true' ? 1 : 0); }
    if (id_membro)          { where.push('mu.id_membro = ?'); params.push(Number(id_membro)); }

    const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const totalRow = row(await knex.raw(`SELECT COUNT(*) as c FROM multas mu ${wc}`, params));

    const multas = rows(await knex.raw(`
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
    `, [...params, Number(limit), offset]));

    const resumo = row(await knex.raw(`
      SELECT
        COUNT(*) as total_multas,
        SUM(CASE WHEN pago = 0 THEN valor ELSE 0 END) as total_pendente,
        SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END) as total_recebido
      FROM multas mu ${wc}
    `, params));

    res.json({ ...resumo, total: Number(totalRow.c), pagina: Number(page), limite: Number(limit), multas });
  },

  async buscarPorId(req, res) {
    const knex = getDb();
    const multa = row(await knex.raw(`
      SELECT mu.*, m.nome as membro_nome, m.email as membro_email,
             em.data_emprestimo, em.data_prevista_devolucao, em.data_devolucao,
             l.titulo as livro_titulo
      FROM multas mu
      JOIN membros m ON m.id = mu.id_membro
      JOIN emprestimos em ON em.id = mu.id_emprestimo
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      WHERE mu.id = ?
    `, [req.params.id]));
    if (!multa) return res.status(404).json({ erro: 'Multa não encontrada.' });
    res.json(multa);
  },

  async registrarPagamento(req, res) {
    const knex = getDb();
    const multa = row(await knex.raw('SELECT * FROM multas WHERE id = ?', [req.params.id]));
    if (!multa) return res.status(404).json({ erro: 'Multa não encontrada.' });
    if (multa.pago) return res.status(400).json({ erro: 'Multa já foi paga.' });

    const hoje = new Date().toISOString().split('T')[0];
    await knex('multas').where({ id: req.params.id }).update({ pago: 1, data_pagamento: hoje });
    res.json({ mensagem: 'Pagamento registrado com sucesso.', data_pagamento: hoje, valor: multa.valor });
  },

  async pagarTodasMembro(req, res) {
    const knex = getDb();
    const membro = row(await knex.raw('SELECT * FROM membros WHERE id = ?', [req.params.id]));
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const pendentes = rows(await knex.raw("SELECT * FROM multas WHERE id_membro = ? AND pago = 0", [req.params.id]));
    if (pendentes.length === 0) return res.status(400).json({ erro: 'Membro não possui multas pendentes.' });

    const total = pendentes.reduce((s, m) => s + m.valor, 0);
    const hoje = new Date().toISOString().split('T')[0];
    await knex('multas').where({ id_membro: req.params.id, pago: 0 }).update({ pago: 1, data_pagamento: hoje });

    res.json({ mensagem: `${pendentes.length} multa(s) quitada(s).`, total_pago: total, data_pagamento: hoje });
  },

  async resumoMembro(req, res) {
    const knex = getDb();
    const membro = row(await knex.raw('SELECT id, nome FROM membros WHERE id = ?', [req.params.id]));
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const resumo = row(await knex.raw(`
      SELECT
        COUNT(*) as total_multas,
        SUM(valor) as total_geral,
        SUM(CASE WHEN pago = 0 THEN valor ELSE 0 END) as pendente,
        SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END) as pago
      FROM multas WHERE id_membro = ?
    `, [req.params.id]));

    const multas = rows(await knex.raw(`
      SELECT mu.id, mu.valor, mu.motivo, mu.data_geracao, mu.data_pagamento, mu.pago,
             l.titulo as livro_titulo
      FROM multas mu
      JOIN emprestimos em ON em.id = mu.id_emprestimo
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      WHERE mu.id_membro = ?
      ORDER BY mu.data_geracao DESC
    `, [req.params.id]));

    res.json({ membro, ...resumo, multas });
  },
};

module.exports = multasController;
