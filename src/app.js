'use strict';

require('dotenv').config();
const express  = require('express');
const path     = require('path');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const errorHandler    = require('./middleware/errorHandler');
const { authAdmin }   = require('./middleware/auth');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// Servir front-end estático
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rota do portal admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Página Sobre
app.get('/sobre', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'sobre.html'));
});

// Rotas públicas / portal de membros
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/portal',  require('./routes/portal'));

// Capa de livro pública (imagem — img tags não enviam Authorization)
const livrosCtrl = require('./controllers/livrosController');
app.get('/api/livros/:id/capa', livrosCtrl.servirCapa);

// Login admin (pública)
app.use('/api/admin',   require('./routes/adminAuth'));

// Rotas protegidas (requerem admin JWT)
app.use('/api/autores',      authAdmin, require('./routes/autores'));
app.use('/api/editoras',     authAdmin, require('./routes/editoras'));
app.use('/api/categorias',   authAdmin, require('./routes/categorias'));
app.use('/api/livros',       authAdmin, require('./routes/livros'));
app.use('/api/membros',      authAdmin, require('./routes/membros'));
app.use('/api/emprestimos',  authAdmin, require('./routes/emprestimos'));
app.use('/api/reservas',     authAdmin, require('./routes/reservas'));
app.use('/api/multas',       authAdmin, require('./routes/multas'));
app.use('/api/relatorios',   authAdmin, require('./routes/relatorios'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), versao: '1.0.0' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.use(errorHandler);

module.exports = app;
