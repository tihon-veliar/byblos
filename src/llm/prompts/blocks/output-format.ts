export const OUTPUT_FORMAT = `

RESPONSE MUST STRICTLY FOLLOW THIS STRUCTURE.
Do not add any text before or after the defined format.
Do not include explanations or comments.

- Write NOTE AREA first
- Write <<<META>>> exactly once at the end
- <<<META>>> must be the last structural marker

- Everything before <<<META>>> is NOTE AREA
- Everything after <<<META>>> is META AREA

- If there is only one note, do not use <<<NOTE>>>
- If there are multiple notes, separate them with <<<NOTE>>>

EXAMPLE: SINGLE NOTE

# Note title

Note text.

<<<META>>>
key = value

-------

EXAMPLE: MULTIPLE NOTES

# First note title

First note text.

<<<NOTE>>>

# Second note title

Second note text with [[First note title]].

<<<META>>>
key = value

-------

EXAMPLE: LINKED NOTES

# Hallucination in Language Models

LLMs can generate false information when they lack grounding or sufficient context, which relates to [[Importance of Context in LLMs]].

<<<NOTE>>>

# Importance of Context in LLMs

Providing clear context reduces hallucinations in language models such as [[Hallucination in Language Models]].

<<<META>>>
key = value


`.trim();
