'use strict';

require('dotenv').config();
const { runMigrations } = require('./database/migrations');
const { runSeed }       = require('./database/seed');
const app               = require('./app');

const PORT = Number(process.env.PORT || 3000);

runMigrations();
runSeed();

app.listen(PORT, () => {
  console.log(`\n📚 Biblioteca Brasil API rodando em http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
