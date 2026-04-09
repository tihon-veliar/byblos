export const REFINEMENT_TASK = `

Input:
- INPUT defines the primary idea to be transformed
- CONTEXT is supplementary and must not override the meaning of INPUT

Operation:

- Transform the draft into final notes

- Decide whether the draft can be expressed as a single atomic note
- If the draft contains multiple ideas or cannot fit into a short note, decompose it into multiple notes

- Each note must represent a single atomic idea
- If multiple notes are created, they must form a coherent and connected set

- Produce META according to META SPEC

Linking:

- If multiple notes are generated, they must form a connected set

- Each note must include at least one link to another generated note

- Links between generated notes may be placed at the end of the note

- If a note relates to concepts in CONTEXT, include links to those notes when relevant

- Links must reflect real semantic relationships
- Do not add links that do not carry meaning

Constraints:

- Follow NOTE_RULES
- Follow OUTPUT_FORMAT
- Always include META
- Use <<<META>>> exactly once at the end of the response
- Do not include explanations outside notes
- Do not describe your reasoning
`.trim();

export const REFINEMENT_META_SPEC = `
- Include:
- mode = refinement

- Include source_draft_summary using string array format
- source_draft_summary:
  - short summary of the draft
  - must capture the core idea of the draft
  - must not repeat note text
  - 1 sentence only
  - no markdown
  - plain text
`.trim();

export const REFINEMENT_PROMPT_PRESET = {
  task: REFINEMENT_TASK,
  metaSpec: REFINEMENT_META_SPEC,
};
