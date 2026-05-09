'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getDb } = require('../database');
const { validarCPF, limparCPF } = require('../utils/cpf');

const PERFIS_ADMIN = ['admin', 'bibliotecario'];

const adminAuthController = {

  /* POST /api/admin/login — aceita CPF + senha de membro com perfil admin/bibliotecario */
  async login(req, res) {
    const { cpf, senha } = req.body;
    if (!cpf || !senha) {
      return res.status(400).json({ erro: 'CPF e senha são obrigatórios.' });
    }

    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return res.status(401).json({ erro: 'CPF ou senha incorretos.' });
    }
    const cpfFmt = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    const db = getDb();
    const membro = db.prepare('SELECT * FROM membros WHERE cpf = ?').get(cpfFmt);

    if (!membro || !membro.senha_hash || !membro.ativo) {
      return res.status(401).json({ erro: 'CPF ou senha incorretos.' });
    }
    if (!PERFIS_ADMIN.includes(membro.perfil)) {
      return res.status(403).json({ erro: 'Acesso negado. Perfil sem permissão de administrador.' });
    }

    const ok = await bcrypt.compare(senha, membro.senha_hash);
    if (!ok) return res.status(401).json({ erro: 'CPF ou senha incorretos.' });

    const token = jwt.sign(
      { role: 'admin', id: membro.id, nome: membro.nome, perfil: membro.perfil },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({ token, nome: membro.nome, perfil: membro.perfil });
  },
};

module.exports = adminAuthController;
