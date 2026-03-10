const sqlite3 = require("sqlite3").verbose();

const db = require("./database");

const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS soal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipe TEXT NOT NULL,
      soal TEXT NOT NULL,
      opsi TEXT,
      kolomA TEXT,
      kolomB TEXT,
      kunci TEXT,
      pembahasan TEXT
    )
  `);
});

module.exports = db;