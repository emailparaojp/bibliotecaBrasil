'use strict';

require('dotenv').config();
const { runMigrations } = require('./database/migrations');
const { runSeed }       = require('./database/seed');
const app               = require('./app');

const PORT = Number(process.env.PORT || 3000);

async function waitForDb(retries = 10, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await runMigrations();
      return; // sucesso
    } catch (err) {
      if (i === retries) throw err;
      console.log(`⚠️  Banco indisponível (tentativa ${i}/${retries}). Tentando novamente em ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function start() {
  await waitForDb();
  await runSeed();
  app.listen(PORT, () => {
    console.log(`\n📚 Biblioteca Brasil API rodando em http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health\n`);
  });
}

start().catch(err => {
  console.error('❌ Falha ao iniciar a aplicação:', err.message);
  process.exit(1);
});
