export const GENERATION_TASK = `

Input:

- INPUT defines the primary idea to be explored
- CONTEXT is supplementary and must not override the meaning of INPUT

Operation:

- Transform the input into draft notes
- Draft notes are exploratory working material, not final notes

- Decide whether the input should remain as one draft note or be expanded into multiple draft notes
- If the input contains multiple distinguishable ideas, concrete subtopics, or named facets, decompose it into multiple draft notes
- If multiple draft notes are created, they must remain relevant to the same input and form a coherent set
- Prefer decomposition when a single note would otherwise become a generic umbrella summary
- If the input names a broad domain such as traditions, history, institutions, people, places, or causes, expand it into several concrete notes rather than one overview note

- Draft notes must expose key concepts and directions for retrieval
- Draft notes should name and describe concrete elements, not just announce categories

- Generate search phrases for the next search stage

- Place search phrases into META as search_phrases

- The draft must reflect the meaning of INPUT, not just the provided CONTEXT

Linking:

- If multiple notes are generated, they must form a connected set

- Each note must include at least one link to another generated note

- Links between generated notes may be placed at the end of the note

- If a note relates to concepts in CONTEXT, include links to those notes when relevant

- Links must reflect real semantic relationships
- Do not add links that do not carry meaning
- If multiple notes are generated from one broad input, make the links reflect the structure between the subtopics

Constraints:

- Follow NOTE_RULES
- Follow OUTPUT_FORMAT
- Always include META
- Use <<<META>>> exactly once at the end of the response
- Do not treat draft notes as final notes
- Do not describe your reasoning
- Do not write notes that begin with phrases like "brief description", "overview", "this note describes", or "this section covers"
`.trim();

export const GENERATION_META_SPEC = `

- Include:
  mode = draft

- Include search_phrases using string array format

- search_phrases must:
  - contain short retrieval phrases
  - be relevant for the next search stage
  - use plain text only
  - not include markdown

- Include retrieval_seed using string format
  - retrieval_seed:
  - optional
  - single string
  - represents the central idea of the draft
  - used as a semantic anchor for retrieval
`.trim();

export const GENERATION_PROMPT_PRESET = {
  task: GENERATION_TASK,
  metaSpec: GENERATION_META_SPEC,
};
