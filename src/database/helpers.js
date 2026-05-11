'use strict';

/**
 * Normalizes knex.raw() results across all supported databases:
 *   - SQLite (better-sqlite3): returns rows array directly
 *   - MySQL/MariaDB (mysql2):  returns [rows_array, fields_array]
 *   - PostgreSQL (pg):         returns { rows: [...] }
 */
function rows(r) {
  if (Array.isArray(r) && Array.isArray(r[0])) return r[0]; // MySQL/MariaDB
  if (Array.isArray(r)) return r;                            // SQLite
  return r.rows || [];                                       // PostgreSQL
}

function row(r) {
  return rows(r)[0] ?? null;
}

module.exports = { rows, row };
