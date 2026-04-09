export const NOTE_RULES = `
- Each note must represent a single atomic idea
- Each note must be short (1–3 sentences)
- Do not write long explanations or essays
- Notes must be concise and information-dense
- Each note must be self-contained and understandable without external explanation
- Notes represent nodes in a connected knowledge graph
- Relationships between notes should be expressed using links
- Links may be placed either inside the text or as a separate line at the end of the note

ALLOWED MARKUP

# Heading 1
## Heading 2
### Heading 3

Paragraph text

- Bullet list
1. Numbered list

> Blockquote

**bold**
*italic*

#tag

[[Link]]

RESTRICTIONS

- Do not use more than one H1 heading per note
- Do not include empty sections or placeholders

FORBIDDEN

- [[Link|Alias]]
- [[Link#Heading]]
- [[Link#^block]]

- ![[Embed]]
- ![[image.png]]

- ---
  frontmatter
  ---

- HTML tags
- Tables
- Block references (^block)
- External links (http, https)
`.trim();
