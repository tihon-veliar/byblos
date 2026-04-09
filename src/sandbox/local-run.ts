import { PipelineOrchestrator } from "../core/pipeline/PipelineOrchestrator";
import { normalize } from "../core/pipeline/Normalizer";
import { ResultAssembler } from "../core/pipeline/ResultAssembler";
import { GenerationModule } from "../llm/generation/GenerationModule";
import { RefinementModule } from "../llm/refinement/RefinementModule";
import { ContextBuilder } from "../core/pipeline/ContextBuilder";
import { SearchModule } from "../indexing/search/SearchModule";
import { propose } from "../llm/linking/LinkProposalModule";

import { createLlmConfig } from "../llm/infra/config";
import { generateRawText } from "../llm/infra/gateway";
import { buildPrompt } from "../llm/prompts/build-prompt";
import { GENERATION_PROMPT_PRESET } from "../llm/prompts/presets/generation";
import { REFINEMENT_PROMPT_PRESET } from "../llm/prompts/presets/refinement";

import { TEST_CASES } from "./prompts-testcase";

import { writeToFile } from "./file-wr";

const SKIP_GPT_CALLS = false;

const runAi = async () => {
  console.log("<<<<Run started");

  console.log(">>>Loading environment variables...");
  console.log(
    "API_SECRET_KEY:",
    process.env.API_SECRET_KEY ? process.env.API_SECRET_KEY : "Not set",
  );

  const config = createLlmConfig({
    apiKey: process.env.API_SECRET_KEY,
    // model: "gpt-4o-mini",
    // model: "gpt-4o",
    model: "gpt-5-mini",
  });

  console.log(">>>Config:");
  console.log("apiKey:", config.apiKey ? config.apiKey : "Not set");
  console.log("model:", config.model);

  try {
    if (!SKIP_GPT_CALLS) {
      const results = [];

      const prompts = TEST_CASES.map((testCase) => ({
        prompt: buildPrompt({
          preset: GENERATION_PROMPT_PRESET,
          context: testCase.context,
          input: testCase.input,
        }),
        name: testCase.name,
      }));
      //.slice(0, 1); // Limit to first 1 test case for now

      for (const prompt of prompts) {
        console.log(`>>>Sending prompt "${prompt.name}" to LLM...`);
        const result = await generateRawText(prompt.prompt, config);
        // const result = `Simulated response for prompt: ${prompt.prompt.slice(0, 50)}...`;
        console.log(">>>LLM call result:", result);
        results.push(`\n ----- ${prompt.name} -----\n` + result);
      }

      console.log(">>>All LLM calls completed. Writing results to file...");
      await writeToFile("./src/sandbox/sandbox_output.txt", results);
      console.log(">>>Results written to sandbox_output.txt");
    } else {
      console.log(
        ">>>Skipping actual LLM calls due to SKIP_GPT_CALLS flag being set to true.",
      );
    }
  } catch (error) {
    console.error(
      ">>>Error during LLM call:",
      error instanceof Error ? error.message : String(error),
    );
  }

  console.log("<<<<Run finished");
};

// const orchestrator = new PipelineOrchestrator({
//   Normalizer: { normalize },
//   SearchModule,
//   ContextBuilder,
//   GenerationModule,
//   RefinementModule,
//   LinkProposalModule: { propose },
//   ResultAssembler,
// });

// const input = process.argv[2] || "test input";

// (async () => {
//   const result = await orchestrator.run({ text: input });
//   console.log(JSON.stringify(result, null, 2));
// })();

const generationModuleTest = async () => {
  const input = "What are the key differences between human and animal?";

  const normalizedInput = normalize(input);

  const initialMatches = SearchModule.search(normalizedInput);

  const context = ContextBuilder.build(initialMatches);

  console.log(">>>Context for Generation Module:", initialMatches);


  

  
  const result = await GenerationModule.generate({ text: input, context });

  console.log(">>>Generation Module Test Result:", result);
};

generationModuleTest();
