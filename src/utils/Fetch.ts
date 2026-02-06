import fetch from "node-fetch";

export async function imageUrlToBase64(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch image");
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
} 

export async function pageUrlToText(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch HTML page: ${response.status}`);
  }

  return await response.text();
}