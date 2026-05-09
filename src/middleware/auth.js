'use strict';

const jwt = require('jsonwebtoken');

/**
 * Middleware JWT para membros (portal público).
 * Requer header: Authorization: Bearer <token>
 */
function authMembro(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Autenticação necessária.' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    if (payload.role !== 'membro') throw new Error('Role inválida');
    req.membro = payload;
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

/**
 * Middleware JWT para admins.
 * Requer header: Authorization: Bearer <adminToken>
 */
function authAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Autenticação de administrador necessária.' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('Role inválida');
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ erro: 'Token de administrador inválido ou expirado.' });
  }
}

module.exports = { authMembro, authAdmin };
