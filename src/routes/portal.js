'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/portalController');
const { authMembro } = require('../middleware/auth');

const router = Router();

const livrosCtrl = require('../controllers/livrosController');

// Rotas públicas
router.get('/livros', ctrl.searchLivros);
router.get('/livros/:id/capa', livrosCtrl.servirCapa);
router.get('/livros/:id', ctrl.getLivro);
router.get('/categorias', ctrl.getCategorias);
router.get('/autores', ctrl.getAutores);

// Rotas autenticadas (membro)
router.post('/reservas', authMembro, ctrl.criarReserva);
router.delete('/reservas/:id', authMembro, ctrl.cancelarReserva);
router.get('/minhas-reservas', authMembro, ctrl.minhasReservas);
router.get('/meu-historico', authMembro, ctrl.meuHistorico);
router.get('/minhas-multas', authMembro, ctrl.minhasMultas);

module.exports = router;
