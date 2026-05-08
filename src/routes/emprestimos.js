'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/emprestimosController');

router.get('/',           ctrl.listar);
router.get('/atrasados',  ctrl.atrasados);
router.get('/:id', param('id').isInt(), validate, ctrl.buscarPorId);

router.post('/',
  body('id_exemplar').isInt().withMessage('id_exemplar é obrigatório e deve ser inteiro.'),
  body('id_membro').isInt().withMessage('id_membro é obrigatório e deve ser inteiro.'),
  validate, ctrl.realizar);

router.patch('/:id/devolver', param('id').isInt(), validate, ctrl.devolver);
router.patch('/:id/renovar',  param('id').isInt(), validate, ctrl.renovar);

module.exports = router;
