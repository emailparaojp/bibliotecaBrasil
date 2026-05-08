'use strict';

const router = require('express').Router();
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/multasController');

router.get('/',    ctrl.listar);
router.get('/:id', param('id').isInt(), validate, ctrl.buscarPorId);
router.patch('/:id/pagar', param('id').isInt(), validate, ctrl.registrarPagamento);

router.get('/membro/:id',          param('id').isInt(), validate, ctrl.resumoMembro);
router.patch('/membro/:id/pagar-tudo', param('id').isInt(), validate, ctrl.pagarTodasMembro);

module.exports = router;
