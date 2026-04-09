import { generateText } from "ai";
import { createProvider } from "./provider";
import type { LlmConfig } from "./config";

export async function generateRawText(
  input: string,
  config: LlmConfig,
): Promise<string> {
  const model = createProvider(config);

  const result = await generateText({
    model,
    prompt: input,
    providerOptions: {
      openai: {
        reasoningEffort: "low",
        //reasoningEffort: "minimal",
      },
    },
  });

  //console.log(">>>Raw LLM response:", result);

  return result.text;
}
