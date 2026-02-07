import * as fs from "node:fs";
import path from "node:path";
import { Ollama } from "ollama";
import { CONFIG } from "../utils/Config";

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