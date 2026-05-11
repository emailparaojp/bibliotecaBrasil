'use strict';

require('dotenv').config();
const path = require('path');

let knex;

function getDb() {
  if (!knex) {
    if (process.env.DATABASE_URL) {
      knex = require('knex')({
        client: 'pg',
        connection: process.env.DATABASE_URL,
        pool: { min: 2, max: 10 },
        searchPath: ['public'],
      });
    } else {
      const DB_PATH = path.resolve(process.env.DB_PATH || './biblioteca.db');
      knex = require('knex')({
        client: 'better-sqlite3',
        connection: { filename: DB_PATH },
        useNullAsDefault: true,
        pool: {
          afterCreate(conn, cb) {
            conn.pragma('journal_mode = WAL');
            conn.pragma('foreign_keys = ON');
            cb(null, conn);
          },
        },
      });
    }
  }
  return knex;
}

async function closeDb() {
  if (knex) {
    await knex.destroy();
    knex = null;
  }
}

module.exports = { getDb, closeDb };
