'use strict';

require('dotenv').config();
const express  = require('express');
const path     = require('path');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Servir front-end estático
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rotas
app.use('/api/autores',      require('./routes/autores'));
app.use('/api/editoras',     require('./routes/editoras'));
app.use('/api/categorias',   require('./routes/categorias'));
app.use('/api/livros',       require('./routes/livros'));
app.use('/api/membros',      require('./routes/membros'));
app.use('/api/emprestimos',  require('./routes/emprestimos'));
app.use('/api/reservas',     require('./routes/reservas'));
app.use('/api/multas',       require('./routes/multas'));
app.use('/api/relatorios',   require('./routes/relatorios'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), versao: '1.0.0' });
});

// Rota raiz com documentação resumida
app.get('/', (req, res) => {
  res.json({
    app: 'Biblioteca Brasil API',
    versao: '1.0.0',
    endpoints: {
      autores:     '/api/autores',
      editoras:    '/api/editoras',
      categorias:  '/api/categorias',
      livros:      '/api/livros',
      membros:     '/api/membros',
      emprestimos: '/api/emprestimos',
      reservas:    '/api/reservas',
      multas:      '/api/multas',
      relatorios:  '/api/relatorios',
    },
    documentacao: 'Consulte o README.md para documentação completa.',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.use(errorHandler);

module.exports = app;
