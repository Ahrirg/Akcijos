import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'Storage.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS discounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Shop TEXT NOT NULL,
    Name TEXT NOT NULL,
    DiscountAmountInProc REAL NOT NULL,
    CostBeforeDiscount REAL NOT NULL,
    CostAfterDiscount REAL NOT NULL,
    DiscountEndDate TEXT NOT NULL,
    ItemAddedDate TEXT NOT NULL,
    ImportedFromWhere TEXT,
    AutoImported INTEGER DEFAULT 0,
    UNIQUE(Shop, Name)
  );
  
  CREATE INDEX IF NOT EXISTS idx_shop ON discounts(Shop);
  CREATE INDEX IF NOT EXISTS idx_name ON discounts(Name);
`);

export default db;