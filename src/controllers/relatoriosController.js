'use strict';

const { getDb } = require('../database');
const { rows, row } = require('../database/helpers');
const { isMysql, diasAtraso, diasRestantes, anoMes } = require('../database/dialect');

const relatoriosController = {
  async acervo(req, res) {
    const knex = getDb();
    const totalLivros     = (await knex('livros').count('id as c').first()).c;
    const totalExemplares = (await knex('exemplares').count('id as c').first()).c;
    const disponiveis     = (await knex('exemplares').where({ disponivel: 1 }).count('id as c').first()).c;
    const emprestados     = (await knex('exemplares').where({ disponivel: 0 }).count('id as c').first()).c;

    const porCategoria = rows(await knex.raw(`
      SELECT c.nome as categoria,
             COUNT(DISTINCT l.id) as total_livros,
             COUNT(e.id) as total_exemplares,
             SUM(CASE WHEN e.disponivel = 1 THEN 1 ELSE 0 END) as disponiveis
      FROM categorias c
      LEFT JOIN livros l ON l.id_categoria = c.id
      LEFT JOIN exemplares e ON e.id_livro = l.id
      GROUP BY c.id, c.nome ORDER BY total_livros DESC
    `));

    const porCondicao = rows(await knex.raw(`
      SELECT condicao, COUNT(*) as total
      FROM exemplares GROUP BY condicao
    `));

    res.json({
      resumo: { totalLivros: Number(totalLivros), totalExemplares: Number(totalExemplares), disponiveis: Number(disponiveis), emprestados: Number(emprestados) },
      porCategoria,
      porCondicao,
    });
  },

  async livrosMaisEmprestados(req, res) {
    const knex = getDb();
    const { limit = 10, periodo_dias } = req.query;

    let where = '';
    let params = [];
    if (periodo_dias) {
      // Calcula data em JS para evitar funções de data SQLite-específicas
      const since = new Date(Date.now() - Number(periodo_dias) * 86400000).toISOString().split('T')[0];
      where = `AND em.data_emprestimo >= ?`;
      params.push(since);
    }

    const livros = rows(await knex.raw(`
      SELECT l.id, l.titulo, l.isbn,
             a.nome as autor,
             c.nome as categoria,
             COUNT(em.id) as total_emprestimos,
             COUNT(DISTINCT em.id_membro) as membros_distintos
      FROM livros l
      JOIN exemplares ex ON ex.id_livro = l.id
      JOIN emprestimos em ON em.id_exemplar = ex.id
      LEFT JOIN autores a ON a.id = l.id_autor
      LEFT JOIN categorias c ON c.id = l.id_categoria
      WHERE 1=1 ${where}
      GROUP BY l.id, l.titulo, l.isbn, a.nome, c.nome
      ORDER BY total_emprestimos DESC
      LIMIT ?
    `, [...params, Number(limit)]));

    res.json(livros);
  },

  async membrosAtivos(req, res) {
    const knex = getDb();
    const { limit = 10 } = req.query;
    const membros = rows(await knex.raw(`
      SELECT m.id, m.nome, m.tipo,
             COUNT(em.id) as total_emprestimos,
             COUNT(CASE WHEN em.status IN ('Ativo', 'Atrasado') THEN 1 END) as emprestimos_ativos
      FROM membros m
      JOIN emprestimos em ON em.id_membro = m.id
      GROUP BY m.id, m.nome, m.tipo
      ORDER BY total_emprestimos DESC
      LIMIT ?
    `, [Number(limit)]));
    res.json(membros);
  },

  async situacaoEmprestimos(req, res) {
    const knex = getDb();
    await knex('emprestimos')
      .where('status', 'Ativo')
      .where('data_prevista_devolucao', '<', knex.raw('CURRENT_DATE'))
      .update({ status: 'Atrasado' });

    const porStatus = rows(await knex.raw(`
      SELECT status, COUNT(*) as total FROM emprestimos GROUP BY status
    `));

    const atrasadosPorTipo = rows(await knex.raw(`
      SELECT m.tipo, COUNT(*) as total_atrasados,
             SUM(${diasAtraso(knex, 'em.data_prevista_devolucao')}) as total_dias_atraso
      FROM emprestimos em
      JOIN membros m ON m.id = em.id_membro
      WHERE em.status = 'Atrasado'
      GROUP BY m.tipo
    `));

    const multasPendentes = row(await knex.raw(`
      SELECT COUNT(*) as total_multas, ROUND(SUM(valor), 2) as total_valor
      FROM multas WHERE pago = 0
    `));

    res.json({ porStatus, atrasadosPorTipo, multasPendentes });
  },

  async devolucoesPrevistas(req, res) {
    const knex = getDb();
    const { dias = 7 } = req.query;

    // Datas calculadas em JS para compatibilidade cross-database
    const hoje   = new Date().toISOString().split('T')[0];
    const limite = new Date(Date.now() + Number(dias) * 86400000).toISOString().split('T')[0];

    const devolucoes = rows(await knex.raw(`
      SELECT em.id, em.data_prevista_devolucao,
             m.nome as membro_nome, m.email, m.telefone,
             l.titulo as livro_titulo, ex.num_tombo,
             ${diasRestantes(knex, 'em.data_prevista_devolucao')} as dias_restantes
      FROM emprestimos em
      JOIN membros m ON m.id = em.id_membro
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      WHERE em.status IN ('Ativo', 'Atrasado')
        AND em.data_prevista_devolucao BETWEEN ? AND ?
      ORDER BY em.data_prevista_devolucao ASC
    `, [hoje, limite]));
    res.json({ dias_horizonte: Number(dias), total: devolucoes.length, devolucoes });
  },

  async inventario(req, res) {
    const knex = getDb();

    const livros = rows(await knex.raw(`
      SELECT l.id, l.isbn, l.titulo, l.localizacao,
             a.nome as autor,
             c.nome as categoria,
             COUNT(e.id) as total_exemplares,
             SUM(CASE WHEN e.disponivel = 1 THEN 1 ELSE 0 END) as disponiveis,
             SUM(CASE WHEN e.disponivel = 0 THEN 1 ELSE 0 END) as emprestados,
             GROUP_CONCAT(e.condicao) as condicoes
      FROM livros l
      LEFT JOIN autores a ON a.id = l.id_autor
      LEFT JOIN categorias c ON c.id = l.id_categoria
      LEFT JOIN exemplares e ON e.id_livro = l.id
      GROUP BY l.id, l.isbn, l.titulo, l.localizacao, a.nome, c.nome
      ORDER BY l.localizacao, l.titulo
    `));
    res.json({ total: livros.length, livros });
  },

  async financeiroMultas(req, res) {
    const knex = getDb();
    const resumo = row(await knex.raw(`
      SELECT
        COUNT(*) as total_multas,
        COUNT(CASE WHEN pago = 0 THEN 1 END) as multas_pendentes,
        COUNT(CASE WHEN pago = 1 THEN 1 END) as multas_pagas,
        ROUND(SUM(valor), 2) as valor_total,
        ROUND(SUM(CASE WHEN pago = 0 THEN valor ELSE 0 END), 2) as valor_pendente,
        ROUND(SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END), 2) as valor_recebido
      FROM multas
    `));

    const porMes = rows(await knex.raw(`
      SELECT ${anoMes(knex, 'data_geracao')} as mes,
             COUNT(*) as total,
             ROUND(SUM(valor), 2) as valor_gerado,
             ROUND(SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END), 2) as valor_recebido
      FROM multas
      GROUP BY mes ORDER BY mes DESC LIMIT 12
    `));

    res.json({ resumo, porMes });
  },

  async membrosComMultasPendentes(req, res) {
    const knex = getDb();
    const membros = rows(await knex.raw(`
      SELECT m.id, m.nome, m.email, m.telefone, m.tipo,
             COUNT(mu.id) as total_multas,
             ROUND(SUM(mu.valor), 2) as total_pendente
      FROM membros m
      JOIN multas mu ON mu.id_membro = m.id
      WHERE mu.pago = 0
      GROUP BY m.id, m.nome, m.email, m.telefone, m.tipo
      ORDER BY total_pendente DESC
    `));
    res.json({ total: membros.length, membros });
  },

  async dashboard(req, res) {
    const knex = getDb();
    await knex('emprestimos')
      .where('status', 'Ativo')
      .where('data_prevista_devolucao', '<', knex.raw('CURRENT_DATE'))
      .update({ status: 'Atrasado' });
    await knex('reservas')
      .where('status', 'Ativa')
      .where('data_expiracao', '<', knex.raw('CURRENT_DATE'))
      .update({ status: 'Expirada' });

    const hoje = new Date().toISOString().split('T')[0];

    const totalLivros     = Number((await knex('livros').count('id as c').first()).c);
    const totalExemplares = Number((await knex('exemplares').count('id as c').first()).c);
    const totalMembros    = Number((await knex('membros').where({ ativo: 1 }).count('id as c').first()).c);
    const empAtivos       = Number((await knex('emprestimos').whereIn('status', ['Ativo', 'Atrasado']).count('id as c').first()).c);
    const empAtrasados    = Number((await knex('emprestimos').where({ status: 'Atrasado' }).count('id as c').first()).c);
    const reservasAtivas  = Number((await knex('reservas').where({ status: 'Ativa' }).count('id as c').first()).c);
    const multasPendentes = row(await knex.raw('SELECT COUNT(*) as c, ROUND(COALESCE(SUM(valor),0), 2) as valor FROM multas WHERE pago = 0'));
    const empHoje         = Number((await knex('emprestimos').whereRaw('DATE(created_at) = ?', [hoje]).count('id as c').first()).c);
    const devHoje         = Number((await knex('emprestimos').whereRaw('data_devolucao = ?', [hoje]).count('id as c').first()).c);

    res.json({
      acervo:      { livros: totalLivros, exemplares: totalExemplares },
      membros:     { ativos: totalMembros },
      emprestimos: { ativos: empAtivos, atrasados: empAtrasados, realizados_hoje: empHoje, devolucoes_hoje: devHoje },
      reservas:    { ativas: reservasAtivas },
      multas:      { quantidade_pendente: Number(multasPendentes.c), valor_pendente: multasPendentes.valor },
    });
  },
};

module.exports = relatoriosController;
