'use strict';

const { getDb } = require('../database');

const DIAS_RESERVA = Number(process.env.DIAS_RESERVA || 3);

function hoje() {
  return new Date().toISOString().split('T')[0];
}

function somarDias(dataStr, dias) {
  const d = new Date(dataStr + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

const reservasController = {
  listar(req, res) {
    const db = getDb();
    reservasController._expirarReservas(db);
    const { id_membro, id_livro, status } = req.query;
    let where = [];
    let params = [];
    if (id_membro) { where.push('r.id_membro = ?'); params.push(Number(id_membro)); }
    if (id_livro)  { where.push('r.id_livro = ?');  params.push(Number(id_livro)); }
    if (status)    { where.push('r.status = ?');    params.push(status); }
    const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const reservas = db.prepare(`
      SELECT r.id, r.data_reserva, r.data_expiracao, r.status,
             m.id as membro_id, m.nome as membro_nome,
             l.id as livro_id, l.titulo as livro_titulo, l.isbn,
             (SELECT COUNT(*) FROM exemplares e WHERE e.id_livro = l.id AND e.disponivel = 1) as exemplares_disponiveis
      FROM reservas r
      JOIN membros m ON m.id = r.id_membro
      JOIN livros l ON l.id = r.id_livro
      ${wc}
      ORDER BY r.data_reserva ASC
    `).all(...params);

    res.json(reservas);
  },

  criar(req, res) {
    const db = getDb();
    reservasController._expirarReservas(db);
    const { id_livro, id_membro } = req.body;

    const membro = db.prepare('SELECT * FROM membros WHERE id = ?').get(id_membro);
    if (!membro)      return res.status(404).json({ erro: 'Membro não encontrado.' });
    if (!membro.ativo) return res.status(400).json({ erro: 'Membro inativo.' });
    if (membro.data_validade < hoje()) return res.status(400).json({ erro: 'Matrícula expirada.' });

    const livro = db.prepare('SELECT * FROM livros WHERE id = ?').get(id_livro);
    if (!livro) return res.status(404).json({ erro: 'Livro não encontrado.' });

    // Verifica disponibilidade — se há exemplar disponível, sugere emprestar diretamente
    const disponivel = db.prepare("SELECT COUNT(*) as c FROM exemplares WHERE id_livro = ? AND disponivel = 1").get(id_livro);
    if (disponivel.c > 0) return res.status(400).json({ erro: 'O livro está disponível para empréstimo imediato. Não é necessário reservar.' });

    // Verifica se já tem reserva ativa
    const jaReservou = db.prepare("SELECT COUNT(*) as c FROM reservas WHERE id_membro = ? AND id_livro = ? AND status = 'Ativa'").get(id_membro, id_livro);
    if (jaReservou.c > 0) return res.status(409).json({ erro: 'Membro já possui reserva ativa para este livro.' });

    // Verifica se já tem o livro emprestado
    const jaEmprestado = db.prepare(`
      SELECT COUNT(*) as c FROM emprestimos em
      JOIN exemplares ex ON ex.id = em.id_exemplar
      WHERE em.id_membro = ? AND ex.id_livro = ? AND em.status IN ('Ativo', 'Atrasado')
    `).get(id_membro, id_livro);
    if (jaEmprestado.c > 0) return res.status(400).json({ erro: 'Membro já possui este livro emprestado.' });

    const posicaoFila = db.prepare("SELECT COUNT(*) as c FROM reservas WHERE id_livro = ? AND status = 'Ativa'").get(id_livro).c + 1;
    const dataExpiracao = somarDias(hoje(), DIAS_RESERVA);

    const result = db.prepare(`
      INSERT INTO reservas (id_livro, id_membro, data_expiracao) VALUES (?, ?, ?)
    `).run(id_livro, id_membro, dataExpiracao);

    res.status(201).json({
      id: result.lastInsertRowid,
      mensagem: 'Reserva realizada com sucesso.',
      posicao_fila: posicaoFila,
      data_expiracao: dataExpiracao,
      livro: livro.titulo,
    });
  },

  cancelar(req, res) {
    const db = getDb();
    const reserva = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);
    if (!reserva) return res.status(404).json({ erro: 'Reserva não encontrada.' });
    if (reserva.status !== 'Ativa') return res.status(400).json({ erro: `Reserva já está com status "${reserva.status}".` });
    db.prepare("UPDATE reservas SET status = 'Cancelada' WHERE id = ?").run(req.params.id);
    res.json({ mensagem: 'Reserva cancelada com sucesso.' });
  },

  filaPorLivro(req, res) {
    const db = getDb();
    reservasController._expirarReservas(db);
    const livro = db.prepare('SELECT * FROM livros WHERE id = ?').get(req.params.id);
    if (!livro) return res.status(404).json({ erro: 'Livro não encontrado.' });

    const fila = db.prepare(`
      SELECT r.id, r.data_reserva, r.data_expiracao,
             ROW_NUMBER() OVER (ORDER BY r.data_reserva) as posicao,
             m.id as membro_id, m.nome as membro_nome
      FROM reservas r
      JOIN membros m ON m.id = r.id_membro
      WHERE r.id_livro = ? AND r.status = 'Ativa'
      ORDER BY r.data_reserva ASC
    `).all(req.params.id);

    const disponiveis = db.prepare("SELECT COUNT(*) as c FROM exemplares WHERE id_livro = ? AND disponivel = 1").get(req.params.id).c;
    res.json({ livro: livro.titulo, exemplares_disponiveis: disponiveis, fila });
  },

  _expirarReservas(db) {
    db.prepare("UPDATE reservas SET status = 'Expirada' WHERE status = 'Ativa' AND data_expiracao < date('now')").run();
  },
};

module.exports = reservasController;
