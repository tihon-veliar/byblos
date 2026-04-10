import type { Input, PipelineResult } from "./contracts";
import type { PipelineModules } from "./pipeline-modules";

export class PipelineOrchestrator {
  constructor(
    private readonly modules: PipelineModules,
    private readonly logger: Pick<Console, "log"> = console,
  ) {}

  async run(input: Input): Promise<PipelineResult> {
    const normalizedText = this.modules.Normalizer.normalize(input.text);
    this.log("Normalize", `text=${normalizedText}`);

    const initialMatches = this.modules.SearchModule.search(normalizedText);
    this.log("Search-1", `matches=${initialMatches.length}`);

    const context1 = this.modules.ContextBuilder.build(initialMatches);
    this.log("Context-1", `matches=${initialMatches.length}`);

    const draft = await this.modules.GenerationModule.generate({
      text: normalizedText,
      context: context1,
    });
    this.log("Generate-Draft", `draft.content=${draft.content}`);

    const generatedQuery = [draft.retrievalSeed, ...draft.retrievalQueries]
      .join(" ")
      .trim(); // TODO: Keep search-2 query simple for Sprint 1 MVP.
    const generatedMatches = this.modules.SearchModule.search(generatedQuery);
    this.log("Search-2", `matches=${generatedMatches.length}`);

    const context2 = this.modules.ContextBuilder.build([
      ...initialMatches,
      ...generatedMatches,
    ]);
    this.log(
      "Context-2",
      `matches=${initialMatches.length + generatedMatches.length}`,
    );

    const refined = await this.modules.RefinementModule.refine({
      draft,
      context: context2,
      matches: [...generatedMatches, ...initialMatches],
    });
    this.log(
      "Refine",
      `nodes=${refined.nodes.length} links=${refined.links.length}`,
    );

    const proposedLinks = this.modules.LinkProposalModule.propose({
      nodes: refined.nodes,
      matches: generatedMatches,
    });
    this.log("Link", `links=${proposedLinks.length}`);

    const result = this.modules.ResultAssembler.assemble({
      nodes: refined.nodes,
      matches: {
        initial: initialMatches,
        generated: generatedMatches,
      },
      links: [...refined.links, ...proposedLinks],
    });

    this.log(
      "Assemble",
      `status=${result.status} nodes=${result.nodes.length} links=${result.links.length}`,
    );

    return result;
  }

  private log(stepName: string, summary: string): void {
    this.logger.log(`[${stepName}] ${summary}`);
  }
}
