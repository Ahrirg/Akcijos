import { updatePageParsedStatus, getUnparsedPages, insertProduct, getMagazineById } from "../utils/db";
import { getPageImage } from "../utils/Temp";
import { ProductAkcija, Page } from "../types/DiscountTypes";
import { askOllama } from "../parsers/Ollama";
import { askGoogle } from "../parsers/Google";
import { CONFIG } from "../utils/Config";

interface LLM_Product {
  product_name: string;
  price_before_discount: number;
  price_after_discount: number;
}

export async function getItemDiscountsFromImage(
  imageBytes: Buffer,
): Promise<LLM_Product[] | undefined> {

  let output = "";

  switch (CONFIG.AI_TYPE) {
    case "google":
      console.log("[GoogleAI] Starting...");
      output = await askGoogle(imageBytes);
      console.log("[GoogleAI] Done");
      break;

    case "ollama":
      output = await askOllama(imageBytes);
      break;

    default:
      throw new Error(`Unsupported AI type: ${CONFIG.AI_TYPE}`);
  }

  return parseProducts(output);
}

function isProductArray(data: unknown): data is LLM_Product[] {
  if (!Array.isArray(data)) return false;

  let nullCount = 0;
  let totalPriceFields = 0;

  for (const item of data) {
    if (typeof item !== "object" || item === null) return false;

    const obj = item as Record<string, unknown>;

    if (typeof obj.product_name !== "string") return false;

    const before = obj.price_before_discount;
    const after = obj.price_after_discount;

    totalPriceFields += 2;

    if (before === null) {
      nullCount++;
    } else if (typeof before !== "number" || !Number.isFinite(before)) {
      return false;
    }

    if (after === null) {
      nullCount++;
    } else if (typeof after !== "number" || !Number.isFinite(after)) {
      return false;
    }
  }

  // if >70% of price fields are null → reject
  if (nullCount / totalPriceFields > 0.7) {
    return false;
  }

  // normalize null → 0
  for (const item of data) {
    const obj = item as Record<string, unknown>;

    if (obj.price_before_discount === null) {
      obj.price_before_discount = 0.0;
    }

    if (obj.price_after_discount === null) {
      obj.price_after_discount = 0.0;
    }
  }

  return true;
}

function parseProducts(jsonText: string): LLM_Product[] | undefined {
  let parsed: unknown;

  console.log(jsonText)
  jsonText = jsonText.replaceAll("```json", "").replaceAll("```", "");
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    console.error("LLM returned bad output (bad json)");
    return undefined;
  }

  if (!isProductArray(parsed)) {
    console.error("LLM returned bad output (not an product array)");
    return undefined;
  }

  return parsed;
}

async function addToDatabase(Items: LLM_Product[], Page: Page) {
  for (let index = 0; index < Items.length; index++) {
    const element = Items[index];

    const [costBefore, costAfter] = element.price_before_discount > element.price_after_discount
      ? [element.price_before_discount, element.price_after_discount]
      : [element.price_after_discount, element.price_before_discount];

    const Magazine = getMagazineById(Page.MagazineId);

    const formatedProduct: ProductAkcija = {
      ProductName: element.product_name,
      ShopName: Magazine ? Magazine.ShopName : "",
      CostBeforeDiscount: costBefore,
      CostAfterDiscount: costAfter,
      AddedTime: new Date(),
      EndTime: Magazine && Magazine.EndTime ? Magazine.EndTime : new Date(),
      PageId: Page.PageId ? Page.PageId : -1,
      DiscountSizeProc: Math.round((costBefore-costAfter)/costBefore*100)
    }

    console.log(formatedProduct);
    insertProduct(formatedProduct);
  }
}

export async function parseUnparsedData() {
  const unparsedPages = getUnparsedPages();

  for (let index = 0; index < unparsedPages.length; index++) {
    const element = unparsedPages[index];

    if (element.Parsed || !element.PageId) {
      continue;
    }

    console.log(`[LLM PARSER] parsing ${index+1}/${unparsedPages.length} | page id: ${element.PageId}`);

    const imageBytes = await getPageImage(element.ImageUUID);
    const result = await getItemDiscountsFromImage(imageBytes);

    if (result) {
      await addToDatabase(result, element);
      updatePageParsedStatus(element.PageId, true);
    } else {
      console.log(`Failed to parse page ${element.PageId}`);
    }
  }
}