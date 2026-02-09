import { updatePageParsedStatus, getUnparsedPages, insertProduct } from "../utils/db";
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

  return data.every(item => {
    if (typeof item !== "object" || item === null) return false;

    const obj = item as Record<string, unknown>;

    return (
      typeof obj.product_name === "string" &&
      typeof obj.price_before_discount === "number" &&
      Number.isFinite(obj.price_before_discount) &&
      typeof obj.price_after_discount === "number" &&
      Number.isFinite(obj.price_after_discount)
    );
  });
}

function parseProducts(jsonText: string): LLM_Product[] | undefined {
  let parsed: unknown;

  console.log(jsonText)
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    console.error("LLM returned bad output");
    return undefined;
  }

  if (!isProductArray(parsed)) {
    console.error("LLM returned bad output");
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

    const formatedProduct: ProductAkcija = {
      ProductName: element.product_name,
      ShopName: "Maxima",
      CostBeforeDiscount: costBefore,
      CostAfterDiscount: costAfter,
      AddedTime: new Date(),
      EndTime: new Date(),
      PageId: Page.PageId ? Page.PageId : -1,
      DiscountSizeProc: costAfter / costBefore * 100
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