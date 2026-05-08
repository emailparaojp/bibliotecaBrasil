'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/reservasController');

router.get('/', ctrl.listar);

router.post('/',
  body('id_livro').isInt().withMessage('id_livro é obrigatório.'),
  body('id_membro').isInt().withMessage('id_membro é obrigatório.'),
  validate, ctrl.criar);

router.patch('/:id/cancelar', param('id').isInt(), validate, ctrl.cancelar);
router.get('/livro/:id/fila', param('id').isInt(), validate, ctrl.filaPorLivro);

module.exports = router;
