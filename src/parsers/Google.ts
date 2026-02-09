import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../utils/Config";
import * as fs from "node:fs";
import path from "node:path";


const ai = new GoogleGenAI({ apiKey: CONFIG.GOOGLE_API });

const prompt: string = fs.readFileSync(
  path.resolve(__dirname, "..", "data", "promptGoogle.txt"),
  { encoding: "utf-8" }
);

export async function askGoogle(imageBytes: Buffer) : Promise<string>{
  const response = await ai.models.generateContent({
    model: "gemma-3-27b-it",
    contents: [
      {
        inlineData: {
          mimeType: "image/png",
          data: imageBytes.toString("base64"),
        },
      },
      prompt,
    ],
  });

  if (!response || !response.text) {
      console.log("There was problem trying to get answer");
      return "";
  }

  console.log(response.text);
  return response.text
}