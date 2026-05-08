'use strict';

const { getDb } = require('../database');

const relatoriosController = {
  acervo(req, res) {
    const db = getDb();
    const totalLivros     = db.prepare('SELECT COUNT(*) as c FROM livros').get().c;
    const totalExemplares = db.prepare('SELECT COUNT(*) as c FROM exemplares').get().c;
    const disponiveis     = db.prepare('SELECT COUNT(*) as c FROM exemplares WHERE disponivel = 1').get().c;
    const emprestados     = db.prepare('SELECT COUNT(*) as c FROM exemplares WHERE disponivel = 0').get().c;

    const porCategoria = db.prepare(`
      SELECT c.nome as categoria,
             COUNT(DISTINCT l.id) as total_livros,
             COUNT(e.id) as total_exemplares,
             SUM(CASE WHEN e.disponivel = 1 THEN 1 ELSE 0 END) as disponiveis
      FROM categorias c
      LEFT JOIN livros l ON l.id_categoria = c.id
      LEFT JOIN exemplares e ON e.id_livro = l.id
      GROUP BY c.id ORDER BY total_livros DESC
    `).all();

    const porCondicao = db.prepare(`
      SELECT condicao, COUNT(*) as total
      FROM exemplares GROUP BY condicao
    `).all();

    res.json({
      resumo: { totalLivros, totalExemplares, disponiveis, emprestados },
      porCategoria,
      porCondicao,
    });
  },

  livrosMaisEmprestados(req, res) {
    const db = getDb();
    const { limit = 10, periodo_dias } = req.query;

    let where = '';
    let params = [];
    if (periodo_dias) {
      where = `AND em.data_emprestimo >= date('now', '-' || ? || ' days')`;
      params.push(Number(periodo_dias));
    }

    const livros = db.prepare(`
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
      GROUP BY l.id
      ORDER BY total_emprestimos DESC
      LIMIT ?
    `).all(...params, Number(limit));

    res.json(livros);
  },

  membrosAtivos(req, res) {
    const db = getDb();
    const { limit = 10 } = req.query;
    const membros = db.prepare(`
      SELECT m.id, m.nome, m.tipo,
             COUNT(em.id) as total_emprestimos,
             COUNT(CASE WHEN em.status IN ('Ativo', 'Atrasado') THEN 1 END) as emprestimos_ativos
      FROM membros m
      JOIN emprestimos em ON em.id_membro = m.id
      GROUP BY m.id
      ORDER BY total_emprestimos DESC
      LIMIT ?
    `).all(Number(limit));
    res.json(membros);
  },

  situacaoEmprestimos(req, res) {
    const db = getDb();
    db.prepare(`
      UPDATE emprestimos SET status = 'Atrasado'
      WHERE status = 'Ativo' AND data_prevista_devolucao < date('now')
    `).run();

    const porStatus = db.prepare(`
      SELECT status, COUNT(*) as total FROM emprestimos GROUP BY status
    `).all();

    const atrasadosPorTipo = db.prepare(`
      SELECT m.tipo, COUNT(*) as total_atrasados,
             SUM(CAST((julianday('now') - julianday(em.data_prevista_devolucao)) AS INTEGER)) as total_dias_atraso
      FROM emprestimos em
      JOIN membros m ON m.id = em.id_membro
      WHERE em.status = 'Atrasado'
      GROUP BY m.tipo
    `).all();

    const multasPendentes = db.prepare(`
      SELECT COUNT(*) as total_multas, ROUND(SUM(valor), 2) as total_valor
      FROM multas WHERE pago = 0
    `).get();

    res.json({ porStatus, atrasadosPorTipo, multasPendentes });
  },

  devolucoesPrevistas(req, res) {
    const db = getDb();
    const { dias = 7 } = req.query;
    const devolucoes = db.prepare(`
      SELECT em.id, em.data_prevista_devolucao,
             m.nome as membro_nome, m.email, m.telefone,
             l.titulo as livro_titulo, ex.num_tombo,
             CAST((julianday(em.data_prevista_devolucao) - julianday('now')) AS INTEGER) as dias_restantes
      FROM emprestimos em
      JOIN membros m ON m.id = em.id_membro
      JOIN exemplares ex ON ex.id = em.id_exemplar
      JOIN livros l ON l.id = ex.id_livro
      WHERE em.status IN ('Ativo', 'Atrasado')
        AND em.data_prevista_devolucao BETWEEN date('now') AND date('now', '+' || ? || ' days')
      ORDER BY em.data_prevista_devolucao ASC
    `).all(Number(dias));
    res.json({ dias_horizonte: Number(dias), total: devolucoes.length, devolucoes });
  },

  inventario(req, res) {
    const db = getDb();
    const livros = db.prepare(`
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
      GROUP BY l.id
      ORDER BY l.localizacao, l.titulo
    `).all();
    res.json({ total: livros.length, livros });
  },

  financeiroMultas(req, res) {
    const db = getDb();
    const resumo = db.prepare(`
      SELECT
        COUNT(*) as total_multas,
        COUNT(CASE WHEN pago = 0 THEN 1 END) as multas_pendentes,
        COUNT(CASE WHEN pago = 1 THEN 1 END) as multas_pagas,
        ROUND(SUM(valor), 2) as valor_total,
        ROUND(SUM(CASE WHEN pago = 0 THEN valor ELSE 0 END), 2) as valor_pendente,
        ROUND(SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END), 2) as valor_recebido
      FROM multas
    `).get();

    const porMes = db.prepare(`
      SELECT strftime('%Y-%m', data_geracao) as mes,
             COUNT(*) as total,
             ROUND(SUM(valor), 2) as valor_gerado,
             ROUND(SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END), 2) as valor_recebido
      FROM multas
      GROUP BY mes ORDER BY mes DESC LIMIT 12
    `).all();

    res.json({ resumo, porMes });
  },

  membrosComMultasPendentes(req, res) {
    const db = getDb();
    const membros = db.prepare(`
      SELECT m.id, m.nome, m.email, m.telefone, m.tipo,
             COUNT(mu.id) as total_multas,
             ROUND(SUM(mu.valor), 2) as total_pendente
      FROM membros m
      JOIN multas mu ON mu.id_membro = m.id
      WHERE mu.pago = 0
      GROUP BY m.id
      ORDER BY total_pendente DESC
    `).all();
    res.json({ total: membros.length, membros });
  },

  dashboard(req, res) {
    const db = getDb();
    db.prepare("UPDATE emprestimos SET status = 'Atrasado' WHERE status = 'Ativo' AND data_prevista_devolucao < date('now')").run();
    db.prepare("UPDATE reservas SET status = 'Expirada' WHERE status = 'Ativa' AND data_expiracao < date('now')").run();

    const totalLivros     = db.prepare('SELECT COUNT(*) as c FROM livros').get().c;
    const totalExemplares = db.prepare('SELECT COUNT(*) as c FROM exemplares').get().c;
    const totalMembros    = db.prepare('SELECT COUNT(*) as c FROM membros WHERE ativo = 1').get().c;
    const empAtivos       = db.prepare("SELECT COUNT(*) as c FROM emprestimos WHERE status IN ('Ativo', 'Atrasado')").get().c;
    const empAtrasados    = db.prepare("SELECT COUNT(*) as c FROM emprestimos WHERE status = 'Atrasado'").get().c;
    const reservasAtivas  = db.prepare("SELECT COUNT(*) as c FROM reservas WHERE status = 'Ativa'").get().c;
    const multasPendentes = db.prepare('SELECT COUNT(*) as c, ROUND(COALESCE(SUM(valor),0),2) as valor FROM multas WHERE pago = 0').get();
    const empHoje         = db.prepare("SELECT COUNT(*) as c FROM emprestimos WHERE date(created_at) = date('now')").get().c;
    const devHoje         = db.prepare("SELECT COUNT(*) as c FROM emprestimos WHERE data_devolucao = date('now')").get().c;

    res.json({
      acervo:     { livros: totalLivros, exemplares: totalExemplares },
      membros:    { ativos: totalMembros },
      emprestimos:{ ativos: empAtivos, atrasados: empAtrasados, realizados_hoje: empHoje, devolucoes_hoje: devHoje },
      reservas:   { ativas: reservasAtivas },
      multas:     { quantidade_pendente: multasPendentes.c, valor_pendente: multasPendentes.valor },
    });
  },
};

module.exports = relatoriosController;
