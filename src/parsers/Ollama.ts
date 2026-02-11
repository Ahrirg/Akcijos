import { fetchForever } from "../utils/fetchWithTimeout";
import { CONFIG } from "../utils/Config";
import * as fs from "node:fs";
import path from "node:path";

const prompt: string = fs.readFileSync(
  path.resolve(CONFIG.DB_PATH, "prompt.txt"),
  { encoding: "utf-8" }
);

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


export async function askOllama(
  imageBytes: Buffer
): Promise<string> {
  try {
    const imageBase64 = imageBytes.toString("base64");

    const requestBody: OllamaChatRequest = {
      // model: "alessandrobenin01/NuExtract2.0-8B:latest",
      model: "qwen3-vl:8b",
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