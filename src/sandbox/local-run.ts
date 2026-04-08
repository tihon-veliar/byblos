import { PipelineOrchestrator } from "../core/pipeline/PipelineOrchestrator";
import { normalize } from "../core/pipeline/Normalizer";
import { ResultAssembler } from "../core/pipeline/ResultAssembler";
import { GenerationModule } from "../llm/generation/GenerationModule";
import { RefinementModule } from "../llm/refinement/RefinementModule";
import { ContextBuilder } from "../core/pipeline/ContextBuilder";
import { SearchModule } from "../indexing/search/SearchModule";
import { propose } from "../llm/linking/LinkProposalModule";

const orchestrator = new PipelineOrchestrator({
  Normalizer: { normalize },
  SearchModule,
  ContextBuilder,
  GenerationModule,
  RefinementModule,
  LinkProposalModule: { propose },
  ResultAssembler,
});

const input = process.argv[2] || "test input";

(async () => {
  const result = await orchestrator.run({ text: input });
  console.log(JSON.stringify(result, null, 2));
})();
