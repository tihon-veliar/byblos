export const META_FORMAT = `
- META section starts after <<<META>>>
- META must contain at least one field

- Each field must follow:
  key = value

- Keys must be snake_case
- Values must be plain text (no markdown)

ARRAY FORMAT

Use block format only:

key = [
- item 1
- item 2
]

- "[" must be on the same line as key =
- each item must start with "- "
- "]" must be on a separate line

RESTRICTIONS

- Do not use inline arrays
- Do not nest arrays
- Do not use markdown inside values
- Do not add text outside key = value format
`.trim();
