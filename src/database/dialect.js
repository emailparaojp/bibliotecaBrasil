'use strict';

function isMysql(knex) {
  const c = knex?.client?.config?.client;
  return c === 'mysql' || c === 'mysql2';
}

/**
 * SQL expression for days elapsed since a date column (integer, >= 0 when past).
 * Usage: `${diasAtraso(knex, 'em.data_prevista_devolucao')} as dias_atraso`
 */
function diasAtraso(knex, col) {
  return isMysql(knex)
    ? `DATEDIFF(CURDATE(), ${col})`
    : `CAST((julianday('now') - julianday(${col})) AS INTEGER)`;
}

/**
 * SQL expression for days remaining until a date column (integer, >= 0 when future).
 */
function diasRestantes(knex, col) {
  return isMysql(knex)
    ? `DATEDIFF(${col}, CURDATE())`
    : `CAST((julianday(${col}) - julianday('now')) AS INTEGER)`;
}

/**
 * SQL expression for year-month string from a date column, e.g. '2026-05'.
 */
function anoMes(knex, col) {
  return isMysql(knex)
    ? `DATE_FORMAT(${col}, '%Y-%m')`
    : `strftime('%Y-%m', ${col})`;
}

/**
 * SQL aggregate for comma-separated string of values in a group.
 */
function groupConcat(knex, col) {
  return isMysql(knex)
    ? `GROUP_CONCAT(${col})`
    : `GROUP_CONCAT(${col})`;
}

module.exports = { isMysql, diasAtraso, diasRestantes, anoMes, groupConcat };
