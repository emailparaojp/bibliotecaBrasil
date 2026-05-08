'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/relatoriosController');

router.get('/dashboard',                ctrl.dashboard);
router.get('/acervo',                   ctrl.acervo);
router.get('/inventario',               ctrl.inventario);
router.get('/livros-mais-emprestados',  ctrl.livrosMaisEmprestados);
router.get('/membros-mais-ativos',      ctrl.membrosAtivos);
router.get('/situacao-emprestimos',     ctrl.situacaoEmprestimos);
router.get('/devolucoes-previstas',     ctrl.devolucoesPrevistas);
router.get('/financeiro-multas',        ctrl.financeiroMultas);
router.get('/membros-com-multas',       ctrl.membrosComMultasPendentes);

module.exports = router;
