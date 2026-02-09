import { fetch, Agent } from "undici";
import type { RequestInit as UndiciRequestInit } from "undici";

const agent = new Agent({
  headersTimeout: 0, // wait forever for headers
  bodyTimeout: 0,    // wait forever for body
});

export interface FetchForeverOptions {
  keepAliveMs?: number;
  onProgress?: (message: string) => void;
  fetchOptions?: UndiciRequestInit;
}

export async function fetchForever(
  url: string,
  options: FetchForeverOptions = {}
): Promise<Response> {
  const {
    keepAliveMs = 30_000,
    onProgress,
    fetchOptions = {},
  } = options;

  let keepAliveId: NodeJS.Timeout | null = null;
  const startTime = Date.now();

  if (onProgress) {
    keepAliveId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60);
      onProgress(`Request still running... (${elapsed} minutes elapsed)`);
    }, keepAliveMs);
  }

  try {
    onProgress?.("Starting request...");

    const response = await fetch(url, {
      ...fetchOptions,
      dispatcher: agent,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    onProgress?.("Request completed successfully");
    return response;
  } finally {
    if (keepAliveId) clearInterval(keepAliveId);
  }
}
