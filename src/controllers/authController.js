'use strict';

const { getDb }      = require('../database');
const { rows, row }  = require('../database/helpers');
const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { validarCPF, limparCPF } = require('../utils/cpf');

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

const authController = {

  /* POST /api/auth/register */
  async register(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        erros: errors.array().map(e => ({ campo: e.path, mensagem: e.msg }))
      });
    }

    const knex = getDb();
    const cpfLimpo = limparCPF(req.body.cpf);

    if (!validarCPF(cpfLimpo)) {
      return res.status(422).json({ erro: 'CPF inválido. Verifique os dígitos digitados.' });
    }

    const tipo = req.body.tipo === 'Estudante' ? 'Estudante' : 'Comum';
    const cpfFmt = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    const hash = await bcrypt.hash(req.body.senha, 12);

    const existente = row(await knex.raw('SELECT id, senha_hash FROM membros WHERE cpf = ?', [cpfFmt]));

    if (existente) {
      if (existente.senha_hash) {
        return res.status(409).json({ erro: 'CPF já cadastrado no portal. Use a opção de login.' });
      }
      await knex('membros').where({ id: existente.id }).update({ senha_hash: hash });
      const membro = row(await knex.raw('SELECT id, nome, cpf, email, tipo FROM membros WHERE id = ?', [existente.id]));
      const token = makeToken({ id: membro.id, cpf: membro.cpf, tipo: membro.tipo, role: 'membro' });
      return res.status(200).json({ mensagem: 'Conta vinculada com sucesso.', token, membro });
    }

    if (req.body.email) {
      const emExiste = row(await knex.raw('SELECT id FROM membros WHERE email = ?', [req.body.email.trim()]));
      if (emExiste) return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }

    const validade = new Date();
    validade.setDate(validade.getDate() + Number(process.env.DIAS_VALIDADE_MEMBRO || 365));

    const result = await knex('membros').insert({
      nome:       req.body.nome.trim(),
      cpf:        cpfFmt,
      email:      req.body.email ? req.body.email.trim() : null,
      telefone:   req.body.telefone ? req.body.telefone.trim() : null,
      endereco:   req.body.endereco ? req.body.endereco.trim() : null,
      tipo,
      data_validade: validade.toISOString().split('T')[0],
      senha_hash: hash,
    }).returning('id');
    const id = typeof result[0] === 'object' ? result[0].id : result[0];

    const membro = row(await knex.raw('SELECT id, nome, cpf, email, tipo FROM membros WHERE id = ?', [id]));
    const token = makeToken({ id: membro.id, cpf: membro.cpf, tipo: membro.tipo, role: 'membro' });
    res.status(201).json({ mensagem: 'Cadastro realizado com sucesso!', token, membro });
  },

  /* POST /api/auth/login */
  async login(req, res) {
    const knex = getDb();
    const cpfLimpo = limparCPF(req.body.cpf || '');
    const cpfFmt   = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    const membro = row(await knex.raw('SELECT * FROM membros WHERE cpf = ?', [cpfFmt]));
    if (!membro || !membro.senha_hash) {
      return res.status(401).json({ erro: 'CPF ou senha incorretos.' });
    }
    if (!membro.ativo) {
      return res.status(403).json({ erro: 'Conta inativa. Entre em contato com a biblioteca.' });
    }

    const ok = await bcrypt.compare(req.body.senha || '', membro.senha_hash);
    if (!ok) return res.status(401).json({ erro: 'CPF ou senha incorretos.' });

    const token = makeToken({ id: membro.id, cpf: membro.cpf, tipo: membro.tipo, role: 'membro', perfil: membro.perfil || null });
    res.json({
      token,
      membro: { id: membro.id, nome: membro.nome, cpf: membro.cpf, email: membro.email, tipo: membro.tipo, perfil: membro.perfil || null }
    });
  },

  /* GET /api/auth/me */
  async me(req, res) {
    const knex = getDb();
    const membro = row(await knex.raw(`
      SELECT m.*,
        (SELECT COUNT(*) FROM emprestimos WHERE id_membro = m.id AND status IN ('Ativo','Atrasado')) as emp_ativos,
        (SELECT COUNT(*) FROM reservas WHERE id_membro = m.id AND status = 'Ativa') as reservas_ativas,
        (SELECT COUNT(*) FROM multas WHERE id_membro = m.id AND pago = 0) as multas_pendentes,
        (SELECT ROUND(COALESCE(SUM(valor),0), 2) FROM multas WHERE id_membro = m.id AND pago = 0) as valor_multas_pendentes
      FROM membros m WHERE m.id = ?
    `, [req.membro.id]));

    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const { senha_hash, ...semSenha } = membro;
    res.json(semSenha);
  },

  /* PUT /api/auth/me */
  async updateMe(req, res) {
    const knex = getDb();
    const id = req.membro.id;

    const membro = row(await knex.raw('SELECT * FROM membros WHERE id = ?', [id]));
    if (!membro) return res.status(404).json({ erro: 'Membro não encontrado.' });

    const nome     = (req.body.nome     || membro.nome).trim();
    const email    = req.body.email    !== undefined ? (req.body.email    || null) : membro.email;
    const telefone = req.body.telefone !== undefined ? (req.body.telefone || null) : membro.telefone;
    const endereco = req.body.endereco !== undefined ? (req.body.endereco || null) : membro.endereco;

    let senhaHash = membro.senha_hash;
    if (req.body.nova_senha) {
      if (!req.body.senha_atual) {
        return res.status(422).json({ erro: 'Informe a senha atual para alterar a senha.' });
      }
      const ok = await bcrypt.compare(req.body.senha_atual, membro.senha_hash);
      if (!ok) return res.status(401).json({ erro: 'Senha atual incorreta.' });
      senhaHash = await bcrypt.hash(req.body.nova_senha, 12);
    }

    await knex('membros').where({ id }).update({ nome, email, telefone, endereco, senha_hash: senhaHash });

    const atualizado = row(await knex.raw('SELECT id, nome, cpf, email, telefone, endereco, tipo, data_validade, ativo FROM membros WHERE id = ?', [id]));
    res.json({ mensagem: 'Perfil atualizado.', membro: atualizado });
  },
};

// Validações express-validator
authController.registerValidators = [
  body('nome').notEmpty().withMessage('Nome é obrigatório.').isLength({ min: 2 }),
  body('cpf').notEmpty().withMessage('CPF é obrigatório.'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('E-mail inválido.'),
  body('tipo').optional().isIn(['Comum', 'Estudante']).withMessage('Tipo inválido.'),
];

module.exports = authController;
