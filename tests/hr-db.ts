import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { fileURLToPath } from "node:url";

// The demo server's HR database (see app/server.mjs). The same default path as the server uses.
const HR_DB_PATH = process.env.HR_DB_PATH ?? fileURLToPath(new URL("../.data/hr.db", import.meta.url));

// Runs a SQL query and returns the rows. Read-only: tests check the data, they never change it.
export function queryHrDb(sql: string, ...params: SQLInputValue[]) {
  const db = new DatabaseSync(HR_DB_PATH, { readOnly: true });
  try {
    return db.prepare(sql).all(...params);
  } finally {
    db.close();
  }
}
