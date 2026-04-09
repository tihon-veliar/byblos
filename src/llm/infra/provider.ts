import { createOpenAI } from "@ai-sdk/openai";
import type { LlmConfig } from "./config";

let cachedClient: ReturnType<typeof createOpenAI> | null = null;

export function createProvider(config: LlmConfig) {
  if (config.provider !== "openai") {
    throw new Error("Unsupported provider");
  }

  if (!cachedClient) {
    cachedClient = createOpenAI({
      apiKey: config.apiKey,
    });
  }

  return cachedClient(config.model);
}
