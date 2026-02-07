export interface Magazine {
  MagazineID?: number;
  EndTime?: string;
  AddedTime: string;
  URL: string;
}

export interface Page {
  PageId?: number;
  EndTime?: string;
  AddedTime: string;
  ImageUUID: string;
  Parsed: number;
  MagazineId: number;
}

export interface ProductAkcija {
  ProductId?: number;
  ProductName: string;
  ShopName: string;
  DiscountSizeProc: number;
  CostBeforeDiscount: number;
  CostAfterDiscount: number;
  EndTime: string;
  AddedTime: string;
  PageId: number;
}