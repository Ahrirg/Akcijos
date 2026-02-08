import * as fs from "node:fs";
import path from "node:path";
import { Ollama } from "ollama";
import { CONFIG } from "../utils/Config";
import { getUnparsedPages } from "../utils/db";
import { getPageImage } from "../utils/Temp";
import { ProductAkcija } from "../types/DiscountTypes";

const ollama = new Ollama({
  host: CONFIG.OLLAMA_SERVER,
})

const prompt: string = fs.readFileSync(
  path.resolve(__dirname, "..", "data", "prompt.txt"),
  { encoding: "utf-8" }
);

type GenerateDiscountsResult = string | undefined;

async function askOllama(
  imageBytes: Buffer,
): Promise<GenerateDiscountsResult> {
  try {
    const response = await ollama.chat({
      model: 'deepseek-ocr:3b',
      messages: [{
        role: "user",
        content: prompt,
        images: [imageBytes]
      }]
    })
    console.log(response.message)
    return response.message.content
  } catch (error) {
    console.warn(error)
    return undefined
  }
}


export async function getItemDiscountsFromImage(
  imageBytes: Buffer,
  retryCount: number = 0,
  maxRetries: number = 10): Promise<GenerateDiscountsResult> {
    return askOllama(imageBytes);
}

function ParseLLMoutput(output: string) : ProductAkcija {
  // todo
  return {
    ProductName: "",
    ShopName: "",
    DiscountSizeProc: 20,
    CostAfterDiscount: 1,
    CostBeforeDiscount: 1,
    EndTime: new Date(),
    AddedTime:  new Date(),
    PageId: 1
  }
}

async function addToDatabase(Items : ProductAkcija[]) {
  // todo
}

export async function parseUnparsedData() {
  const unparsedPages = getUnparsedPages();
  for (let index = 0; index < unparsedPages.length; index++) {
    const element = unparsedPages[index];
    
    if (element.Parsed) { continue; }

    console.log(`Trying to parse ${element.PageId}`);
    console.log(await getItemDiscountsFromImage(await getPageImage(element.ImageUUID)));
  }
}