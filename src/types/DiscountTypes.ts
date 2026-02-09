export interface Magazine {
  MagazineID?: number;
  Name: string;
  ShopName: string;
  EndTime?: Date;
  AddedTime: Date;
  URL: string;
}

export interface Page {
  PageId?: number;
  EndTime?: Date;
  AddedTime: Date;
  ImageUUID: string;
  Parsed: boolean;
  MagazineId: number;
}

export interface ProductAkcija {
  ProductId?: number;
  ProductName: string;
  ShopName: string;
  DiscountSizeProc: number;
  CostBeforeDiscount: number;
  CostAfterDiscount: number;
  EndTime: Date;
  AddedTime: Date;
  PageId: number;
}