'use strict';

const { getDb } = require('../database');
const { rows, row } = require('../database/helpers');

const DIAS_RESERVA = Number(process.env.DIAS_RESERVA || 3);

function hoje() {
  return new Date().toISOString().split('T')[0];
}

function somarDias(dataStr, dias) {
  const d = new Date(dataStr + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

async function _expirarReservas(knex) {
  await knex('reservas')
    .where('status', 'Ativa')
    .where('data_expiracao', '<', knex.raw('CURRENT_DATE'))
    .update({ status: 'Expirada' });
}

const reservasController = {
  async listar(req, res) {
    const knex = getDb();
    await _expirarReservas(knex);
    const { id_membro, id_livro, status } = req.query;
    let where = [];
    let params = [];
    if (id_membro) { where.push('r.id_membro = ?'); params.push(Number(id_membro)); }
    if (id_livro)  { where.push('r.id_livro = ?');  params.push(Number(id_livro)); }
    if (status)    { where.push('r.status = ?');    params.push(status); }
    const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const reservas = rows(await knex.raw(`
      SELECT r.id, r.data_reserva, r.data_expiracao, r.status,
             m.id as membro_id, m.nome as membro_nome,
             l.id as livro_id, l.titulo as livro_titulo, l.isbn,
             (SELECT COUNT(*) FROM exemplares e WHERE e.id_livro = l.id AND e.disponivel = 1) as exemplares_disponiveis
      FROM reservas r
      JOIN membros m ON m.id = r.id_membro
      JOIN livros l ON l.id = r.id_livro
      ${wc}
      ORDER BY r.data_reserva ASC
    `, params));

    res.json(reservas);
  },

  async criar(req, res) {
    const knex = getDb();
    await _expirarReservas(knex);
    const { id_livro, id_membro } = req.body;

    const membro = row(await knex.raw('SELECT * FROM membros WHERE id = ?', [id_membro]));
    if (!membro)       return res.status(404).json({ erro: 'Membro não encontrado.' });
    if (!membro.ativo) return res.status(400).json({ erro: 'Membro inativo.' });
    if (membro.data_validade < hoje()) return res.status(400).json({ erro: 'Matrícula expirada.' });

    const livro = row(await knex.raw('SELECT * FROM livros WHERE id = ?', [id_livro]));
    if (!livro) return res.status(404).json({ erro: 'Livro não encontrado.' });

    const disponivel = row(await knex.raw("SELECT COUNT(*) as c FROM exemplares WHERE id_livro = ? AND disponivel = 1", [id_livro]));
    if (Number(disponivel.c) > 0) return res.status(400).json({ erro: 'O livro está disponível para empréstimo imediato. Não é necessário reservar.' });

    const jaReservou = row(await knex.raw("SELECT COUNT(*) as c FROM reservas WHERE id_membro = ? AND id_livro = ? AND status = 'Ativa'", [id_membro, id_livro]));
    if (Number(jaReservou.c) > 0) return res.status(409).json({ erro: 'Membro já possui reserva ativa para este livro.' });

    const jaEmprestado = row(await knex.raw(`
      SELECT COUNT(*) as c FROM emprestimos em
      JOIN exemplares ex ON ex.id = em.id_exemplar
      WHERE em.id_membro = ? AND ex.id_livro = ? AND em.status IN ('Ativo', 'Atrasado')
    `, [id_membro, id_livro]));
    if (Number(jaEmprestado.c) > 0) return res.status(400).json({ erro: 'Membro já possui este livro emprestado.' });

    const filaRow = row(await knex.raw("SELECT COUNT(*) as c FROM reservas WHERE id_livro = ? AND status = 'Ativa'", [id_livro]));
    const posicaoFila = Number(filaRow.c) + 1;
    const dataExpiracao = somarDias(hoje(), DIAS_RESERVA);

    const result = await knex('reservas').insert({ id_livro, id_membro, data_expiracao: dataExpiracao }).returning('id');
    const id = typeof result[0] === 'object' ? result[0].id : result[0];

    res.status(201).json({
      id,
      mensagem: 'Reserva realizada com sucesso.',
      posicao_fila: posicaoFila,
      data_expiracao: dataExpiracao,
      livro: livro.titulo,
    });
  },

  async cancelar(req, res) {
    const knex = getDb();
    const reserva = row(await knex.raw("SELECT * FROM reservas WHERE id = ?", [req.params.id]));
    if (!reserva) return res.status(404).json({ erro: 'Reserva não encontrada.' });
    if (reserva.status !== 'Ativa') return res.status(400).json({ erro: `Reserva já está com status "${reserva.status}".` });
    await knex('reservas').where({ id: req.params.id }).update({ status: 'Cancelada' });
    res.json({ mensagem: 'Reserva cancelada com sucesso.' });
  },

  async filaPorLivro(req, res) {
    const knex = getDb();
    await _expirarReservas(knex);
    const livro = row(await knex.raw('SELECT * FROM livros WHERE id = ?', [req.params.id]));
    if (!livro) return res.status(404).json({ erro: 'Livro não encontrado.' });

    const fila = rows(await knex.raw(`
      SELECT r.id, r.data_reserva, r.data_expiracao,
             ROW_NUMBER() OVER (ORDER BY r.data_reserva) as posicao,
             m.id as membro_id, m.nome as membro_nome
      FROM reservas r
      JOIN membros m ON m.id = r.id_membro
      WHERE r.id_livro = ? AND r.status = 'Ativa'
      ORDER BY r.data_reserva ASC
    `, [req.params.id]));

    const dispRow = row(await knex.raw("SELECT COUNT(*) as c FROM exemplares WHERE id_livro = ? AND disponivel = 1", [req.params.id]));
    res.json({ livro: livro.titulo, exemplares_disponiveis: Number(dispRow.c), fila });
  },
};

module.exports = reservasController;
