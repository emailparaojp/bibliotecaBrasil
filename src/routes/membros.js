'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/membrosController');

router.get('/', ctrl.listar);
router.get('/:id',          param('id').isInt(), validate, ctrl.buscarPorId);
router.get('/:id/historico', param('id').isInt(), validate, ctrl.historico);

router.post('/',
  body('nome').notEmpty().withMessage('Nome é obrigatório.'),
  body('cpf').notEmpty().withMessage('CPF é obrigatório.'),
  body('tipo').optional().isIn(['Estudante', 'Professor', 'Comum']).withMessage('Tipo inválido.'),
  body('email').optional().isEmail().withMessage('E-mail inválido.'),
  validate, ctrl.criar);

router.put('/:id',
  param('id').isInt(),
  body('tipo').optional().isIn(['Estudante', 'Professor', 'Comum']),
  body('email').optional().isEmail(),
  validate, ctrl.atualizar);

router.patch('/:id/renovar-matricula', param('id').isInt(), validate, ctrl.renovarMatricula);

router.patch('/:id/perfil',
  param('id').isInt(),
  body('perfil').optional({ nullable: true }).isIn(['admin', 'bibliotecario', 'nenhum', '']).withMessage('Perfil inválido.'),
  validate, ctrl.alterarPerfil);

router.patch('/:id/status',
  param('id').isInt(),
  body('ativo').isBoolean().withMessage('Campo "ativo" deve ser booleano.'),
  validate, ctrl.alterarStatus);

module.exports = router;
