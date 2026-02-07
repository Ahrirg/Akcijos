import { TIMEOUT } from "node:dns";
import * as fs from "node:fs";
import path from "node:path";
import { Ollama } from "ollama";

const ollama = new Ollama({
  host: 'http://192.168.10.110:11434',
})


const prompt: string = fs.readFileSync(
  path.resolve(__dirname, "prompt.txt"),
  { encoding: "utf-8" }
);

type GenerateDiscountsResult = string | undefined;

export async function getItemDiscountsFromImage(
  imageBytes: Buffer,
  retryCount: number = 0,
  maxRetries: number = 10
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