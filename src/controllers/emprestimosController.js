'use strict';

const { getDb } = require('../database');

const REGRAS = {
  Estudante: {
    diasEmprestimo: Number(process.env.DIAS_EMPRESTIMO_ESTUDANTE || 7),
    maxEmprestimos: Number(process.env.MAX_EMPRESTIMOS_ESTUDANTE || 3),
  },
  Professor: {
    diasEmprestimo: Number(process.env.DIAS_EMPRESTIMO_PROFESSOR || 14),
    maxEmprestimos: Number(process.env.MAX_EMPRESTIMOS_PROFESSOR || 5),
  },
  Comum: {
    diasEmprestimo: Number(process.env.DIAS_EMPRESTIMO_COMUM || 7),
    maxEmprestimos: Number(process.env.MAX_EMPRESTIMOS_COMUM || 2),
  },
};
const MAX_RENOVACOES = Number(process.env.MAX_RENOVACOES || 2);
const MULTA_DIARIA   = Number(process.env.MULTA_DIARIA || 0.50);

function rows(r) { return Array.isArray(r) ? r : (r.rows || []); }
function row(r)  { return rows(r)[0] ?? null; }

function somarDias(dataStr, dias) {
  const d = new Date(dataStr + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

function hoje() {
  return new Date().toISOString().split('T')[0];
}

function diasEntre(de, ate) {
  const a = new Date(de + 'T12:00:00');
  const b = new Date(ate + 'T12:00:00');
  return Math.floor((b - a) / 86400000);
}

async function atualizarAtrasos(knex) {
  await knex('emprestimos')
    .where('status', 'Ativo')
    .where('data_prevista_devolucao', '<', knex.raw('CURRENT_DATE'))
    .update({ status: 'Atrasado' });
}

const emprestimosController = {
  async listar(req, res) {
    const knex = getDb();
    await atualizarAtrasos(knex);
    const { status, id_membro, id_livro, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = [];
    let params = [];
    if (status)    { where.push('em.status = ?');    params.push(status); }
    if (id_membro) { where.push('em.id_membro = ?'); params.push(Number(id_membro)); }
    if (id_livro)  { where.push('ex.id_livro = ?');  params.push(Number(id_livro)); }

    const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const totalRow = row(await knex.raw(`
      SELECT COUNT(*) as c FROM emprestimos em
      JOIN exemplares ex ON ex.id = em.id_exemplar ${wc}
    `, params));

    const emprestimos = rows(await knex.raw(`
      SELECT em.id, em.data_emprestimo, em.data_prevista_devolucao, em.data_devolucao,
             em.num_renovacoes, em.status,
             m.id as membro_id, m.nome as membro_nome,
             l.id as livro_id, l.titulo as livro_titulo, l.isbn,
             ex.num_tombo,
             CASE WHEN em.status = 'Atrasado'
               THEN CAST((julianday('now') - julianday(em.data_prevista_devolucao)) AS INTEGER)
               ELSE 0 END as dias_atraso,
             mu.valor as multa_valor, mu.pago as multa_paga
      FROM emprestimos em
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      JOIN membros m ON m.id = em.id_membro
      LEFT JOIN multas mu ON mu.id_emprestimo = em.id
      ${wc}
      ORDER BY em.data_emprestimo DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset]));

    res.json({ total: Number(totalRow.c), pagina: Number(page), limite: Number(limit), emprestimos });
  },

  async buscarPorId(req, res) {
    const knex = getDb();
    await atualizarAtrasos(knex);
    const emp = row(await knex.raw(`
      SELECT em.*,
             m.nome as membro_nome, m.tipo as membro_tipo,
             l.titulo as livro_titulo, l.isbn,
             ex.num_tombo, ex.condicao,
             CASE WHEN em.status = 'Atrasado'
               THEN CAST((julianday('now') - julianday(em.data_prevista_devolucao)) AS INTEGER)
               ELSE 0 END as dias_atraso,
             mu.id as multa_id, mu.valor as multa_valor, mu.pago as multa_paga
      FROM emprestimos em
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      JOIN membros m ON m.id = em.id_membro
      LEFT JOIN multas mu ON mu.id_emprestimo = em.id
      WHERE em.id = ?
    `, [req.params.id]));
    if (!emp) return res.status(404).json({ erro: 'Empréstimo não encontrado.' });
    res.json(emp);
  },

  async realizar(req, res) {
    const knex = getDb();
    const { id_exemplar, id_membro } = req.body;

    const membro = row(await knex.raw('SELECT * FROM membros WHERE id = ?', [id_membro]));
    if (!membro)       return res.status(404).json({ erro: 'Membro não encontrado.' });
    if (!membro.ativo) return res.status(400).json({ erro: 'Membro inativo.' });
    if (membro.data_validade < hoje()) return res.status(400).json({ erro: 'Matrícula do membro expirada. Renove antes de emprestar.' });

    const multasPend = row(await knex.raw("SELECT COALESCE(SUM(valor), 0) as total FROM multas WHERE id_membro = ? AND pago = 0", [id_membro]));
    if (Number(multasPend.total) > 0) return res.status(400).json({ erro: `Membro possui R$ ${Number(multasPend.total).toFixed(2)} em multas pendentes. Quite antes de realizar novo empréstimo.` });

    const regras = REGRAS[membro.tipo] || REGRAS.Comum;
    const ativos = row(await knex.raw("SELECT COUNT(*) as c FROM emprestimos WHERE id_membro = ? AND status IN ('Ativo', 'Atrasado')", [id_membro]));
    if (Number(ativos.c) >= regras.maxEmprestimos) return res.status(400).json({ erro: `Limite de ${regras.maxEmprestimos} empréstimo(s) simultâneo(s) atingido para ${membro.tipo}.` });

    const exemplar = row(await knex.raw('SELECT * FROM exemplares WHERE id = ?', [id_exemplar]));
    if (!exemplar)            return res.status(404).json({ erro: 'Exemplar não encontrado.' });
    if (!exemplar.disponivel) return res.status(400).json({ erro: 'Exemplar não está disponível para empréstimo.' });

    const duplicado = row(await knex.raw(`
      SELECT COUNT(*) as c FROM emprestimos em
      JOIN exemplares ex ON ex.id = em.id_exemplar
      WHERE em.id_membro = ? AND ex.id_livro = ? AND em.status IN ('Ativo', 'Atrasado')
    `, [id_membro, exemplar.id_livro]));
    if (Number(duplicado.c) > 0) return res.status(400).json({ erro: 'Membro já possui este livro emprestado.' });

    const dataPrevista = somarDias(hoje(), regras.diasEmprestimo);

    const empId = await knex.transaction(async (trx) => {
      const result = await trx('emprestimos').insert({
        id_exemplar,
        id_membro,
        data_prevista_devolucao: dataPrevista,
      }).returning('id');
      const id = typeof result[0] === 'object' ? result[0].id : result[0];

      await trx('exemplares').where({ id: id_exemplar }).update({ disponivel: 0 });
      await trx('reservas')
        .where({ id_membro, id_livro: exemplar.id_livro, status: 'Ativa' })
        .update({ status: 'Concluida' });

      return id;
    });

    res.status(201).json({
      id: empId,
      mensagem: 'Empréstimo realizado com sucesso.',
      data_prevista_devolucao: dataPrevista,
    });
  },

  async devolver(req, res) {
    const knex = getDb();
    await atualizarAtrasos(knex);
    const emp = row(await knex.raw(`
      SELECT em.*, ex.id_livro, m.tipo as membro_tipo
      FROM emprestimos em
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN membros m ON m.id = em.id_membro
      WHERE em.id = ?
    `, [req.params.id]));
    if (!emp) return res.status(404).json({ erro: 'Empréstimo não encontrado.' });
    if (emp.status === 'Devolvido') return res.status(400).json({ erro: 'Livro já devolvido.' });

    const dataDevolvido = hoje();
    let multaCriada = null;
    let proximaReserva = null;

    await knex.transaction(async (trx) => {
      await trx('emprestimos').where({ id: emp.id }).update({ status: 'Devolvido', data_devolucao: dataDevolvido });
      await trx('exemplares').where({ id: emp.id_exemplar }).update({ disponivel: 1 });

      const diasAtraso = diasEntre(emp.data_prevista_devolucao, dataDevolvido);
      if (diasAtraso > 0) {
        const valor = diasAtraso * MULTA_DIARIA;
        const motivo = `Devolução com ${diasAtraso} dia(s) de atraso.`;
        const multaResult = await trx('multas').insert({
          id_emprestimo: emp.id,
          id_membro:     emp.id_membro,
          valor,
          motivo,
        }).returning('id');
        const multaId = typeof multaResult[0] === 'object' ? multaResult[0].id : multaResult[0];
        multaCriada = { id: multaId, valor, motivo, dias_atraso: diasAtraso };
      }

      proximaReserva = row(await trx.raw(`
        SELECT r.id, r.id_membro, m.nome as membro_nome, m.email
        FROM reservas r
        JOIN membros m ON m.id = r.id_membro
        WHERE r.id_livro = ? AND r.status = 'Ativa'
        ORDER BY r.data_reserva ASC LIMIT 1
      `, [emp.id_livro]));
    });

    const resp = { mensagem: 'Devolução registrada com sucesso.', data_devolucao: dataDevolvido };
    if (multaCriada) resp.multa_gerada = multaCriada;
    if (proximaReserva) resp.aviso_reserva = { mensagem: `Livro reservado por ${proximaReserva.membro_nome}`, reserva_id: proximaReserva.id };
    res.json(resp);
  },

  async renovar(req, res) {
    const knex = getDb();
    await atualizarAtrasos(knex);
    const emp = row(await knex.raw(`
      SELECT em.*, m.tipo as membro_tipo, ex.id_livro
      FROM emprestimos em
      JOIN membros m ON m.id = em.id_membro
      JOIN exemplares ex ON ex.id = em.id_exemplar
      WHERE em.id = ?
    `, [req.params.id]));
    if (!emp) return res.status(404).json({ erro: 'Empréstimo não encontrado.' });
    if (emp.status === 'Devolvido') return res.status(400).json({ erro: 'Empréstimo já devolvido.' });
    if (emp.status === 'Atrasado')  return res.status(400).json({ erro: 'Não é possível renovar empréstimo em atraso. Devolva o livro e quite a multa.' });
    if (emp.num_renovacoes >= MAX_RENOVACOES) return res.status(400).json({ erro: `Limite de ${MAX_RENOVACOES} renovação(ões) atingido.` });

    const reservaExiste = row(await knex.raw("SELECT COUNT(*) as c FROM reservas WHERE id_livro = ? AND status = 'Ativa'", [emp.id_livro]));
    if (Number(reservaExiste.c) > 0) return res.status(400).json({ erro: 'Não é possível renovar: há reserva ativa para este livro por outro membro.' });

    const regras = REGRAS[emp.membro_tipo] || REGRAS.Comum;
    const novaData = somarDias(emp.data_prevista_devolucao, regras.diasEmprestimo);

    await knex('emprestimos').where({ id: emp.id }).update({
      data_prevista_devolucao: novaData,
      num_renovacoes: knex.raw('num_renovacoes + 1'),
      status: 'Ativo',
    });

    res.json({ mensagem: 'Empréstimo renovado com sucesso.', nova_data_devolucao: novaData, renovacoes_restantes: MAX_RENOVACOES - (emp.num_renovacoes + 1) });
  },

  async atrasados(req, res) {
    const knex = getDb();
    await atualizarAtrasos(knex);
    const atrasados = rows(await knex.raw(`
      SELECT em.id, em.data_emprestimo, em.data_prevista_devolucao,
             CAST((julianday('now') - julianday(em.data_prevista_devolucao)) AS INTEGER) as dias_atraso,
             CAST((julianday('now') - julianday(em.data_prevista_devolucao)) AS INTEGER) * ? as multa_estimada,
             m.id as membro_id, m.nome as membro_nome, m.email, m.telefone,
             l.titulo as livro_titulo, ex.num_tombo
      FROM emprestimos em
      JOIN membros m ON m.id = em.id_membro
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      WHERE em.status = 'Atrasado'
      ORDER BY dias_atraso DESC
    `, [MULTA_DIARIA]));
    res.json({ total: atrasados.length, multa_diaria: MULTA_DIARIA, atrasados });
  },
};

module.exports = emprestimosController;
