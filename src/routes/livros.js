'use strict';

const router = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/livrosController');

// Livros
router.get('/',    ctrl.listar);
router.get('/:id', param('id').isInt(), validate, ctrl.buscarPorId);

router.post('/',
  body('titulo').notEmpty().withMessage('Título é obrigatório.'),
  body('isbn').optional().isISBN().withMessage('ISBN inválido.'),
  body('ano_publicacao').optional().isInt({ min: 1000, max: new Date().getFullYear() + 1 }),
  validate, ctrl.criar);

router.put('/:id',
  param('id').isInt(),
  body('titulo').optional().notEmpty(),
  body('isbn').optional().isISBN().withMessage('ISBN inválido.'),
  validate, ctrl.atualizar);

router.delete('/:id', param('id').isInt(), validate, ctrl.remover);

// Exemplares
router.get('/:id/exemplares', param('id').isInt(), validate, ctrl.listarExemplares);

router.post('/:id/exemplares',
  param('id').isInt(),
  body('num_tombo').notEmpty().withMessage('Número de tombo é obrigatório.'),
  body('condicao').optional().isIn(['Novo', 'Bom', 'Regular', 'Ruim']).withMessage('Condição inválida.'),
  validate, ctrl.adicionarExemplar);

router.put('/:id/exemplares/:exemplarId',
  param('id').isInt(), param('exemplarId').isInt(),
  body('condicao').optional().isIn(['Novo', 'Bom', 'Regular', 'Ruim']),
  validate, ctrl.atualizarExemplar);

router.delete('/:id/exemplares/:exemplarId',
  param('id').isInt(), param('exemplarId').isInt(),
  validate, ctrl.removerExemplar);

module.exports = router;
