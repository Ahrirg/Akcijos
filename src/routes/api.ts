// import Database from 'better-sqlite3';
import express, { Request, Response, Router } from 'express';
import cors from 'cors';
// import path from 'path';
import db from '../utils/db';

const router: Router = express.Router();


interface Discount {
  Shop: string;
  Name: string;
  DiscountAmountInProc: number;
  CostBeforeDiscount: number;
  CostAfterDiscount: number;
  DiscountEndDate: Date;
  ItemAddedDate: Date;
  ImportedFromWhere?: string;
  AutoImported?: boolean;
}

// Correct pragma syntax
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

router.use(cors());

router.get('/getTest', (req: Request, res: Response) => {
  console.log("get");
  res.json({
    "test worked?": true
  });
});

router.get('/getDiscountByName', (req: Request, res: Response) => {
  const discountName = req.query.name as string;
  
  if (!discountName) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }
  
  const answer = db.prepare("SELECT * FROM discounts WHERE name = ?").get(discountName);
  res.json(answer || { message: 'Not found' });
});

router.get('/getDiscountByShop', (req: Request, res: Response) => {
  const shopName = req.query.shop as string;
  
  if (!shopName) {
    return res.status(400).json({ error: 'Shop parameter is required' });
  }
  
  const answer = db.prepare("SELECT * FROM discounts WHERE shop = ?").get(shopName);
  console.log(answer)
  res.json(answer || { message: 'Not found' });
});

router.post('/addDiscount', (req: Request, res: Response) => {
  const discount: Discount = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO discounts (Shop, Name, DiscountAmountInProc, CostBeforeDiscount, 
                            CostAfterDiscount, DiscountEndDate, ItemAddedDate, 
                            ImportedFromWhere, AutoImported)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    console.log(req.body);
    
    const result = stmt.run(
      discount.Shop,
      discount.Name,
      discount.DiscountAmountInProc,
      discount.CostBeforeDiscount,
      discount.CostAfterDiscount,
      // Convert Date to string (ISO format)
      typeof discount.DiscountEndDate === 'string' 
        ? discount.DiscountEndDate 
        : new Date(discount.DiscountEndDate).toISOString(),
      typeof discount.ItemAddedDate === 'string' 
        ? discount.ItemAddedDate 
        : new Date(discount.ItemAddedDate).toISOString(),
      discount.ImportedFromWhere || null,
      // Convert boolean to 0 or 1
      discount.AutoImported ? 1 : 0
    );
    
    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to add discount', details: error });
  }
});

module.exports = router;