import Database from 'better-sqlite3';
import path from 'path';
import { Magazine, Page, ProductAkcija } from '../types/DiscountTypes';

const db = new Database(path.join(__dirname, '..', 'Storage.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS Magazine (
    MagazineID INTEGER PRIMARY KEY AUTOINCREMENT,
    EndTime TEXT, -- Nullable
    AddedTime TEXT NOT NULL,
    URL TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Page (
    PageId INTEGER PRIMARY KEY AUTOINCREMENT,
    EndTime TEXT, -- Nullable
    AddedTime TEXT NOT NULL,
    ImageUUID TEXT NOT NULL,
    Parsed INTEGER DEFAULT 0,
    MagazineId INTEGER NOT NULL,
    FOREIGN KEY (MagazineId) REFERENCES Magazine(MagazineID) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ProductAkcija (
    ProductId INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductName TEXT NOT NULL,
    ShopName TEXT NOT NULL,
    DiscountSizeProc REAL,
    CostBeforeDiscount REAL,
    CostAfterDiscount REAL,
    EndTime TEXT NOT NULL,
    AddedTime TEXT NOT NULL,
    PageId INTEGER NOT NULL,
    FOREIGN KEY (PageId) REFERENCES Page(PageId) ON DELETE CASCADE,
    UNIQUE(ProductName, ShopName)
  );

  CREATE INDEX IF NOT EXISTS idx_page_mag ON Page(MagazineId);
  CREATE INDEX IF NOT EXISTS idx_prod_page ON ProductAkcija(PageId);
`);

export function insertMagazine(mag: Magazine): number | bigint {
  const stmt = db.prepare(`
    INSERT INTO Magazine (EndTime, AddedTime, URL) 
    VALUES (@EndTime, @AddedTime, @URL)
  `);
  // If EndTime is undefined, SQLite will insert NULL
  return stmt.run({
    ...mag,
    EndTime: mag.EndTime ?? null 
  }).lastInsertRowid;
}

export function insertPage(page: Page): number | bigint {
  const stmt = db.prepare(`
    INSERT INTO Page (EndTime, AddedTime, ImageUUID, Parsed, MagazineId) 
    VALUES (@EndTime, @AddedTime, @ImageUUID, @Parsed, @MagazineId)
  `);
  return stmt.run({
    ...page,
    EndTime: page.EndTime ?? null
  }).lastInsertRowid;
}

export function insertProduct(product: ProductAkcija): number | bigint {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ProductAkcija 
    (ProductName, ShopName, DiscountSizeProc, CostBeforeDiscount, CostAfterDiscount, EndTime, AddedTime, PageId)
    VALUES (@ProductName, @ShopName, @DiscountSizeProc, @CostBeforeDiscount, @CostAfterDiscount, @EndTime, @AddedTime, @PageId)
  `);
  return stmt.run(product).lastInsertRowid;
}

export function getPagesByMagazine(magazineId: number): Page[] {
  return db.prepare('SELECT * FROM Page WHERE MagazineId = ?').all(magazineId) as Page[];
}

export function getUnparsedPages(): Page[] {
  return db.prepare('SELECT * FROM Page WHERE Parsed = 0').all() as Page[];
}

export function getActiveProducts(offset: number, limit: number): ProductAkcija[] {
  const now = new Date().toISOString();
  return db.prepare(`
    SELECT * FROM ProductAkcija 
    WHERE EndTime > ? 
    ORDER BY AddedTime DESC 
    LIMIT ? OFFSET ?
  `).all(now, limit, offset) as ProductAkcija[];
}

export default db;