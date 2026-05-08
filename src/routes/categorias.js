'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/categoriasController');

router.get('/',                    ctrl.listar);
router.get('/:id', param('id').isInt(), validate, ctrl.buscarPorId);

router.post('/',
  body('nome').notEmpty().withMessage('Nome é obrigatório.'),
  validate, ctrl.criar);

router.put('/:id',
  param('id').isInt(),
  body('nome').optional().notEmpty(),
  validate, ctrl.atualizar);

router.delete('/:id', param('id').isInt(), validate, ctrl.remover);

module.exports = router;
