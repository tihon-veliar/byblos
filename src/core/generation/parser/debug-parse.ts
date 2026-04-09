// core/generation/parser/debug-parse.ts

import { parseLlmOutput } from "./parse-llm-output";

// core/generation/parser/debug-cases.ts

export const debugCases = [
  {
    name: "missing META",
    input: `
# Title

Text
`.trim(),
  },
  {
    name: "multiple META",
    input: `
# Title

Text

<<<META>>>
a = b

<<<META>>>
`.trim(),
  },
  {
    name: "empty note area",
    input: `
<<<META>>>
a = b
`.trim(),
  },
  {
    name: "empty note segment (double NOTE)",
    input: `
# A

Text

<<<NOTE>>>

<<<NOTE>>>

# B

Text

<<<META>>>
`.trim(),
  },
  {
    name: "invalid meta line",
    input: `
# Title

Text

<<<META>>>
just text here
`.trim(),
  },
  {
    name: "array not closed",
    input: `
# Title

Text

<<<META>>>
tags = [
- a
- b
`.trim(),
  },
  {
    name: "invalid array item (no dash)",
    input: `
# Title

Text

<<<META>>>
tags = [
a
- b
]
`.trim(),
  },
  {
    name: "empty array item",
    input: `
# Title

Text

<<<META>>>
tags = [
- 
- b
]
`.trim(),
  },
  {
    name: "nested array",
    input: `
# Title

Text

<<<META>>>
tags = [
- a
- [
]
]
`.trim(),
  },
  {
    name: "inline array (forbidden)",
    input: `
# Title

Text

<<<META>>>
tags = [a, b]
`.trim(),
  },
  {
    name: "garbage after array",
    input: `
# Title

Text

<<<META>>>
tags = [
- a
]
???
`.trim(),
  },
  {
    name: "meta before note (broken order)",
    input: `
<<<META>>>
a = b

# Title

Text
`.trim(),
  },

  {
    name: "valid input",
    input: `
# First note

Some text with [[Link]]

<<<NOTE>>>

# Second note

Another text

<<<META>>>
search_phrases = [
- parser design
- llm output contract
]
mode = test
`.trim(),
  },
];

for (const c of debugCases) {
  const res = parseLlmOutput(c.input);

  console.log("\n===", c.name, "===");
  console.log(res.ok ? "OK" : res.error.code);
}
