import 'dotenv/config';

export const CONFIG = {
  DB_PATH: process.env.DB_PATH ?? './default.db',
  PORT: Number(process.env.PORT) || 3000,
  OLLAMA_SERVER: process.env.OLLAMA_SERVER || "http://localhost:11434",
  GOOGLE_API: process.env.GOOGLE_API,
  AI_TYPE: process.env.AI_TYPE
};