import { PipelineOrchestrator } from "../core/pipeline/PipelineOrchestrator";
import { normalize } from "../core/pipeline/Normalizer";
import { ResultAssembler } from "../core/pipeline/ResultAssembler";
import { GenerationModule } from "../llm/generation/GenerationModule";
import { RefinementModule } from "../llm/refinement/RefinementModule";
import { ContextBuilder } from "../core/pipeline/ContextBuilder";
import { SearchModule } from "../indexing/search/SearchModule";
import { propose } from "../llm/linking/LinkProposalModule";

const generationModuleTest = async () => {
  const input = "What are the key differences between human and animal?";

  const normalizedInput = normalize(input);

  const initialMatches = SearchModule.search(normalizedInput);

  const context = ContextBuilder.build(initialMatches);

  console.log(">>>Context for Generation Module:", context);

  const result = await GenerationModule.generate({ text: input, context });

  const refinmentResult = await RefinementModule.refine({
    draft: result,
    context,
    matches: initialMatches,
  });

  console.log(">>>Generation Module Test Result:", result);
  console.log(">>>Refinement Module Test Result:", refinmentResult);
};

const runOrchestratorTest = async () => {
  const orchestrator = new PipelineOrchestrator({
    Normalizer: { normalize },
    SearchModule: SearchModule,
    ContextBuilder: ContextBuilder,
    GenerationModule: GenerationModule,
    RefinementModule: RefinementModule,
    LinkProposalModule: { propose },
    ResultAssembler: ResultAssembler,
  });
  console.log(">>>Orchestrator initialized with modules.");
  console.log(">>>Running Pipeline Orchestrator Test...");
  const result = await orchestrator.run({ text: "Human vs animal" });
  console.log(">>>Pipeline Orchestrator Test Result:", result);
};

runOrchestratorTest();
