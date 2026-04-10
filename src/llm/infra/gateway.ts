import { generateText } from "ai";
import { createProvider } from "./provider";
import type { LlmConfig } from "./config";
import { createLlmConfig, getLlmConfigFromEnv } from "./config";

const SKIP_AI_CALL = process.env.SKIP_AI_CALL === "true";

export async function generateRawText(input: string): Promise<string> {
  if (SKIP_AI_CALL) {
    return `
# This is a simulated response for development purposes.
Node body
<<<META>>>
search_phrases = [
  - simulated search phrase 1
  - simulated search phrase 2
]
retrieval_seed = simulated retrieval seed
`;
  }

  const model = createProvider(createLlmConfig(getLlmConfigFromEnv()));
  const result = await generateText({
    model,
    prompt: input,
    providerOptions: {
      openai: {
        reasoningEffort: "low",
      },
    },
  });

  return result.text;
}
