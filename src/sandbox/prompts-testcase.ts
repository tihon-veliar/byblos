type TestCase = {
  name: string;
  input: string;
  context: string;
};
export const TEST_CASES = [
  {
    name: "simple_single_note",
    input: `LLMs hallucinate when they lack sufficient context`,
    context: `# Hallucination in Language Models

Hallucination occurs when models generate plausible but false information due to weak grounding.`,
  },

  {
    name: "multi_note_decomposition",
    input: `LLM hallucinations are caused by missing context, reliance on priors, and can be reduced with retrieval and prompt design`,
    context: `# Retrieval Augmentation

Retrieval provides external knowledge to improve grounding.

<<<NOTE>>>

# Prompt Design

Clear prompts reduce ambiguity in model outputs.

<<<NOTE>>>

# Hallucination in Language Models

Hallucination is generation of incorrect but plausible information.`,
  },

  {
    name: "force_internal_linking",
    input: `Missing context leads to hallucination, while providing context reduces hallucination`,
    context: `# Hallucination in Language Models

Hallucination occurs due to insufficient grounding.

<<<NOTE>>>

# Retrieval Augmentation

External knowledge improves grounding.`,
  },

  {
    name: "context_vs_input_priority",
    input: `Hallucination is primarily caused by lack of grounding, not prompt design`,
    context: `# Prompt Design

Prompt engineering is the main factor affecting model accuracy.

<<<NOTE>>>

# Retrieval Augmentation

Adding documents improves factuality.`,
  },

  {
    name: "no_context",
    input: `LLMs rely on statistical patterns which can produce confident but incorrect answers`,
    context: ``,
  },

  {
    name: "overloaded_input",
    input: `Hallucination in language models can arise from missing context, over-reliance on training data priors, ambiguous prompts, lack of verification mechanisms, and absence of retrieval augmentation, while mitigation strategies include grounding, prompt constraints, and evaluation techniques`,
    context: `# Retrieval Augmentation

External knowledge reduces hallucination.

<<<NOTE>>>

# Prompt Design

Clear prompts reduce ambiguity.

<<<NOTE>>>

# Evaluation of LLMs

Verification improves reliability.`,
  },
];
