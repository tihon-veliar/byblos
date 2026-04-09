export type LlmConfig = {
  provider: "openai" // TODO: make this patams configurable when we add more providers
  apiKey: string
  model: string
}

export function createLlmConfig(raw: Partial<LlmConfig>): LlmConfig {
  if (!raw.apiKey) throw new Error("apiKey is required")
  if (!raw.model) throw new Error("model is required")

  return {
    provider: "openai",
    apiKey: raw.apiKey,
    model: raw.model,
  }
}

export function getLlmConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): LlmConfig {
  return createLlmConfig({
    apiKey: env.API_SECRET_KEY,
    model: env.LLM_MODEL ?? "gpt-5-mini",
  });
}
