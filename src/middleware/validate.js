'use strict';

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).json({ erros: erros.array().map(e => ({ campo: e.path, mensagem: e.msg })) });
  }
  next();
}

module.exports = validate;
