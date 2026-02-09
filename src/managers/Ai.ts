import * as fs from "node:fs";
import path from "node:path";
import { CONFIG } from "../utils/Config";
import { getUnparsedPages, insertProduct } from "../utils/db";
import { getPageImage } from "../utils/Temp";
import { ProductAkcija, Page } from "../types/DiscountTypes";
import { fetchForever } from "../utils/fetchWithTimeout";

const prompt: string = fs.readFileSync(
  path.resolve(__dirname, "..", "data", "prompt.txt"),
  { encoding: "utf-8" }
);

interface LLM_Product {
  product_name: string;
  price_before_discount: number;
  price_after_discount: number;
}

interface OllamaMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
  options: {
    temperature: number
  }
  keep_alive: string,
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

async function askOllama(
  imageBytes: Buffer
): Promise<string> {
  try {
    const imageBase64 = imageBytes.toString("base64");

    const requestBody: OllamaChatRequest = {
      model: "alessandrobenin01/NuExtract2.0-8B:latest",
      messages: [
        {
          role: "user",
          content: prompt,
          images: [imageBase64],
          options: {
            temperature: 0
          },
          keep_alive: "0m",
        },
      ],
      stream: false,
    };

    const response = await fetchForever(
      `${CONFIG.OLLAMA_SERVER}/api/chat`,
      {
        fetchOptions: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        onProgress: (msg: string) => console.log(`[Ollama] ${msg}`),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`
      );
    }

    const data: OllamaChatResponse = await response.json() as OllamaChatResponse;
    // console.log(data.message);

    return data.message.content;
  } catch (error) {
    console.warn("Error calling Ollama:", error);
    return "";
  }
}

export async function getItemDiscountsFromImage(
  imageBytes: Buffer,
): Promise<LLM_Product[] | undefined> {
  const output = parseProducts(await askOllama(imageBytes));

  return output;
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

    if (element.Parsed) {
      continue;
    }

    console.log(`Trying to parse ${element.PageId}`);

    const imageBytes = await getPageImage(element.ImageUUID);
    const result = await getItemDiscountsFromImage(imageBytes);

    if (result) {
      await addToDatabase(result, element);
    } else {
      console.log(`Failed to parse page ${element.PageId}`);
    }
  }
}