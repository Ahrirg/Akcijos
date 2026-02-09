// import Database from 'better-sqlite3';
import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import db from '../utils/db';
import { Page } from "../types/DiscountTypes";
import { getPageImage } from "../utils/Temp";

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

router.get("/getImageByPageId", (req: Request, res: Response) => {
  const pageId = Number(req.query.id);

  if (!pageId) {
    return res.status(400).send("Missing or invalid id");
  }

  const dbanswer = db
    .prepare("SELECT * FROM Page WHERE PageId = ?")
    .get(pageId) as Page;

  if (!dbanswer) {
    return res.sendStatus(404);
  }

  getPageImage(dbanswer.ImageUUID).then((imageBuffer) =>{
    if (imageBuffer) {
      res.type("image/png");
      res.send(imageBuffer);
    } else {
      res.json({Error: "Image Not found"})
    }
  });
});

router.get('/getDiscountByName', (req: Request, res: Response) => {
  const discountName = req.query.name as string;
  
  if (!discountName) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }
  
  const answer = db.prepare("SELECT * FROM ProductAkcija WHERE name = ?").get(discountName);
  res.json(answer || { message: 'Not found' });
});

router.get('/getDiscounts', (req: Request, res: Response) => {
  const answer = db.prepare("SELECT * FROM ProductAkcija").all();
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


module.exports = router;