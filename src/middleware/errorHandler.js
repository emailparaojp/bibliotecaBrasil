'use strict';

function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  const status = err.status || err.statusCode || 500;
  const mensagem = err.message || 'Erro interno do servidor.';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERRO]', err);
  }

  res.status(status).json({ erro: mensagem });
}

module.exports = errorHandler;
