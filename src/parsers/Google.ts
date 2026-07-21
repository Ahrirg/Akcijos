import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../utils/Config";
import * as fs from "node:fs";
import path from "node:path";


const ai = new GoogleGenAI({ apiKey: CONFIG.GOOGLE_API });

const prompt: string = fs.readFileSync(
    path.resolve(CONFIG.DB_PATH, "promptGoogle.txt"),
    { encoding: "utf-8" }
);

async function GoogleApi(imageBytes: Buffer): Promise<string> {
    const response = await ai.models.generateContent({
        model: CONFIG.GOOGLE_AI_NAME as string,
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

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
export async function askGoogle(imageBytes: Buffer, attempt: number = 0): Promise<string> {
    if (attempt > 10) { return ""; }
    try {
        return await GoogleApi(imageBytes);
    } catch (err: any) {
        console.log(err);
        if (err.status === 503) {
            console.warn(`Demand high (503). Attempt ${attempt + 1}. Retrying in 60s...`);

            await sleep(60000);
            return askGoogle(imageBytes, attempt + 1);
        }

        throw err;
    }
}