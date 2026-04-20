import { PipelineOrchestrator } from "../core/pipeline/PipelineOrchestrator";
import { normalize } from "../core/pipeline/Normalizer";
import { ResultAssembler } from "../core/pipeline/ResultAssembler";
import { GenerationModule } from "../llm/generation/GenerationModule";
import { RefinementModule } from "../llm/refinement/RefinementModule";
import { ContextBuilder } from "../core/pipeline/ContextBuilder";
import { createSearchModule } from "../indexing/search/SearchModule";
import { buildNoteIndex } from "../indexing/build/build-note-index";

const generationModuleTest = async () => {
  const input = "What are the key differences between human and animal?";
  const searchModule = createSearchModule(buildNoteIndex({ notes: [] }));

  const normalizedInput = normalize(input);

  const initialMatches = searchModule.search({
    text: normalizedInput,
    stage: "search-1",
    limit: 5,
  });

  const context = ContextBuilder.build({
    stage: "generation",
    retrieval: initialMatches,
    resolveNote: (noteId) => searchModule.getNoteById(noteId),
    getNeighborLookup: (noteId) => searchModule.getNeighborLookup(noteId),
  });

  console.log(">>>Context for Generation Module:", context);

  const result = await GenerationModule.generate({ text: input, context });

  const refinmentResult = await RefinementModule.refine({
    draft: result,
    context,
    matches: [...initialMatches.strong, ...initialMatches.related],
  });

  console.log(">>>Generation Module Test Result:", result);
  console.log(">>>Refinement Module Test Result:", refinmentResult);
};

const runOrchestratorTest = async () => {
  const searchModule = createSearchModule(buildNoteIndex({ notes: [] }));
  const orchestrator = new PipelineOrchestrator({
    Normalizer: { normalize },
    SearchModule: searchModule,
    ContextBuilder,
    GenerationModule,
    RefinementModule,
    LinkProposalModule: { propose: () => [] },
    ResultAssembler,
  });
  console.log(">>>Orchestrator initialized with modules.");
  console.log(">>>Running Pipeline Orchestrator Test...");
  const result = await orchestrator.run({ text: "Human vs animal" });
  console.log(">>>Pipeline Orchestrator Test Result:", result);
};

runOrchestratorTest();
