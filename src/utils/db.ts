import Database from 'better-sqlite3';
import path from 'path';
import { Magazine, Page, ProductAkcija } from '../types/DiscountTypes';

const db = new Database(path.join(__dirname, '..', 'Storage.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS Magazine (
    MagazineID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE,
    EndTime TEXT,
    AddedTime TEXT NOT NULL,
    URL TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Page (
    PageId INTEGER PRIMARY KEY AUTOINCREMENT,
    EndTime TEXT,
    AddedTime TEXT NOT NULL,
    ImageUUID TEXT NOT NULL UNIQUE,
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
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO Magazine (Name, EndTime, AddedTime, URL) 
    VALUES (@Name, @EndTime, @AddedTime, @URL)
  `);

  const info = insertStmt.run({
    ...mag,
    EndTime: mag.EndTime?.toISOString() ?? null,
    AddedTime: mag.AddedTime.toISOString()
  });

  if (info.changes > 0) {
    return info.lastInsertRowid;
  }

  const selectStmt = db.prepare('SELECT MagazineID FROM Magazine WHERE Name = ?');
  const row = selectStmt.get(mag.Name) as { MagazineID: number | bigint };
  
  return row.MagazineID;
}

export function insertPage(page: Page): number | bigint {
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO Page (EndTime, AddedTime, ImageUUID, Parsed, MagazineId) 
    VALUES (@EndTime, @AddedTime, @ImageUUID, @Parsed, @MagazineId)
  `);

  const info = insertStmt.run({
    ...page,
    EndTime: page.EndTime?.toISOString() ?? null,
    AddedTime: page.AddedTime.toISOString(),
    Parsed: page.Parsed ? 1 : 0
  });

  if (info.changes > 0) {
    return info.lastInsertRowid;
  }

  const selectStmt = db.prepare('SELECT PageId FROM Page WHERE ImageUUID = ?');
  const row = selectStmt.get(page.ImageUUID) as { PageId: number | bigint };
  
  return row.PageId;
}

export function insertProduct(product: ProductAkcija): number | bigint {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ProductAkcija 
    (ProductName, ShopName, DiscountSizeProc, CostBeforeDiscount, CostAfterDiscount, EndTime, AddedTime, PageId)
    VALUES (@ProductName, @ShopName, @DiscountSizeProc, @CostBeforeDiscount, @CostAfterDiscount, @EndTime, @AddedTime, @PageId)
  `);
  return stmt.run({
    ...product,
    EndTime: product.EndTime.toISOString(),
    AddedTime: product.AddedTime.toISOString()
  }).lastInsertRowid;
}

export function getPagesByMagazine(magazineId: number): Page[] {
  const rows = db.prepare('SELECT * FROM Page WHERE MagazineId = ?').all(magazineId) as any[];
  return rows.map(row => ({
    ...row,
    EndTime: row.EndTime ? new Date(row.EndTime) : undefined,
    AddedTime: new Date(row.AddedTime),
    Parsed: row.Parsed === 1
  }));
}

export function getUnparsedPages(): Page[] {
  const rows = db.prepare('SELECT * FROM Page WHERE Parsed = 0').all() as any[];
  return rows.map(row => ({
    ...row,
    EndTime: row.EndTime ? new Date(row.EndTime) : undefined,
    AddedTime: new Date(row.AddedTime),
    Parsed: false
  }));
}

export function getActiveProducts(offset: number, limit: number): ProductAkcija[] {
  const now = new Date().toISOString();
  const rows = db.prepare(`
    SELECT * FROM ProductAkcija 
    WHERE EndTime > ? 
    ORDER BY AddedTime DESC 
    LIMIT ? OFFSET ?
  `).all(now, limit, offset) as any[];

  return rows.map(row => ({
    ...row,
    EndTime: new Date(row.EndTime),
    AddedTime: new Date(row.AddedTime)
  }));
}

export function getBackupOfdb(name: string){
  db.backup(name);
}
getBackupOfdb("backup.db")
export default db;