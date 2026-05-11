'use strict';

const { getDb } = require('../database');
const { rows, row } = require('../database/helpers');

function dateFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const membrosController = {
  async listar(req, res) {
    const knex = getDb();
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

    const totalRow = row(await knex.raw(`SELECT COUNT(*) as total FROM membros m ${whereClause}`, params));
    const membros = rows(await knex.raw(`
      SELECT m.*,
             COUNT(CASE WHEN e.status IN ('Ativo', 'Atrasado') THEN 1 END) as emprestimos_ativos,
             COALESCE(SUM(CASE WHEN mu.pago = 0 THEN mu.valor ELSE 0 END), 0) as multas_pendentes
      FROM membros m
      LEFT JOIN emprestimos e  ON e.id_membro = m.id
      LEFT JOIN multas mu ON mu.id_membro = m.id
      ${whereClause}
      GROUP BY m.id ORDER BY m.nome
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset]));

    res.json({ total: totalRow.total, pagina: Number(page), limite: Number(limit), membros });
  },

  async buscarPorId(req, res) {
    const knex = getDb();
    const membro = row(await knex.raw(`
      SELECT m.*,
             COALESCE(SUM(CASE WHEN mu.pago = 0 THEN mu.valor ELSE 0 END), 0) as multas_pendentes,
             CASE WHEN m.data_validade < CURRENT_DATE THEN 1 ELSE 0 END as validade_expirada
      FROM membros m
      LEFT JOIN multas mu ON mu.id_membro = m.id
      WHERE m.id = ?
      GROUP BY m.id
    `, [req.params.id]));
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const emprestimosAtivos = rows(await knex.raw(`
      SELECT em.id, em.data_emprestimo, em.data_prevista_devolucao, em.status, em.num_renovacoes,
             l.titulo as livro_titulo, ex.num_tombo
      FROM emprestimos em
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      WHERE em.id_membro = ? AND em.status IN ('Ativo', 'Atrasado')
      ORDER BY em.data_prevista_devolucao
    `, [membro.id]));

    const reservasAtivas = rows(await knex.raw(`
      SELECT r.id, r.data_reserva, r.data_expiracao, r.status,
             l.titulo as livro_titulo, l.id as livro_id
      FROM reservas r
      JOIN livros l ON l.id = r.id_livro
      WHERE r.id_membro = ? AND r.status = 'Ativa'
    `, [membro.id]));

    res.json({ ...membro, emprestimosAtivos, reservasAtivas });
  },

  async criar(req, res) {
    const knex = getDb();
    const { nome, cpf, email, telefone, endereco, tipo, observacoes } = req.body;
    const diasValidade = Number(process.env.DIAS_VALIDADE_MEMBRO || 365);

    try {
      const result = await knex('membros').insert({
        nome,
        cpf,
        email:       email       || null,
        telefone:    telefone    || null,
        endereco:    endereco    || null,
        tipo:        tipo        || 'Comum',
        data_validade: dateFromNow(diasValidade),
        observacoes: observacoes || null,
      }).returning('id');
      const id = typeof result[0] === 'object' ? result[0].id : result[0];
      res.status(201).json({ id, nome, cpf, tipo });
    } catch (e) {
      if (e.message.includes('UNIQUE') || e.message.includes('unique')) return res.status(409).json({ erro: 'CPF ou e-mail já cadastrado.' });
      throw e;
    }
  },

  async atualizar(req, res) {
    const knex = getDb();
    const atual = row(await knex.raw('SELECT * FROM membros WHERE id = ?', [req.params.id]));
    if (!atual) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const { nome, email, telefone, endereco, tipo, observacoes } = req.body;
    try {
      await knex('membros').where({ id: req.params.id }).update({
        nome:        nome        ?? atual.nome,
        email:       email       ?? atual.email,
        telefone:    telefone    ?? atual.telefone,
        endereco:    endereco    ?? atual.endereco,
        tipo:        tipo        ?? atual.tipo,
        observacoes: observacoes ?? atual.observacoes,
      });
      res.json({ mensagem: 'Membro atualizado com sucesso.' });
    } catch (e) {
      if (e.message.includes('UNIQUE') || e.message.includes('unique')) return res.status(409).json({ erro: 'E-mail já em uso por outro membro.' });
      throw e;
    }
  },

  async renovarMatricula(req, res) {
    const knex = getDb();
    const membro = row(await knex.raw('SELECT * FROM membros WHERE id = ?', [req.params.id]));
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });
    const dias = Number(process.env.DIAS_VALIDADE_MEMBRO || 365);
    const base = new Date(membro.data_validade) > new Date() ? membro.data_validade : new Date().toISOString().split('T')[0];
    const novaValidade = new Date(new Date(base).getTime() + dias * 86400000).toISOString().split('T')[0];
    await knex('membros').where({ id: req.params.id }).update({ data_validade: novaValidade, ativo: 1 });
    res.json({ mensagem: 'Matrícula renovada.', nova_validade: novaValidade });
  },

  async alterarStatus(req, res) {
    const knex = getDb();
    const membro = row(await knex.raw('SELECT * FROM membros WHERE id = ?', [req.params.id]));
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    if (req.body.ativo === false || req.body.ativo === 0) {
      const empAtivos = row(await knex.raw("SELECT COUNT(*) as c FROM emprestimos WHERE id_membro = ? AND status IN ('Ativo', 'Atrasado')", [req.params.id]));
      if (Number(empAtivos.c) > 0) return res.status(409).json({ erro: 'Membro possui empréstimos ativos. Devolva os livros antes de inativar.' });
    }
    await knex('membros').where({ id: req.params.id }).update({ ativo: req.body.ativo ? 1 : 0 });
    res.json({ mensagem: `Membro ${req.body.ativo ? 'ativado' : 'inativado'} com sucesso.` });
  },

  async alterarPerfil(req, res) {
    const knex = getDb();
    const membro = row(await knex.raw('SELECT id, cpf, perfil FROM membros WHERE id = ?', [req.params.id]));
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const PERFIS_VALIDOS = [null, 'admin', 'bibliotecario'];
    const perfil = req.body.perfil === '' || req.body.perfil === 'nenhum' ? null : req.body.perfil;

    if (!PERFIS_VALIDOS.includes(perfil)) {
      return res.status(400).json({ erro: 'Perfil inválido. Use: admin, bibliotecario ou nenhum.' });
    }

    await knex('membros').where({ id: req.params.id }).update({ perfil });
    const label = perfil ? `promovido a "${perfil}"` : 'perfil removido';
    res.json({ mensagem: `Membro ${label} com sucesso.` });
  },

  async historico(req, res) {
    const knex = getDb();
    const membro = row(await knex.raw('SELECT id, nome FROM membros WHERE id = ?', [req.params.id]));
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { c: total } = await knex('emprestimos').where({ id_membro: membro.id }).count('id as c').first();
    const historico = rows(await knex.raw(`
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
    `, [membro.id, Number(limit), offset]));

    res.json({ membro, total: Number(total), pagina: Number(page), limite: Number(limit), historico });
  },
};

module.exports = membrosController;
