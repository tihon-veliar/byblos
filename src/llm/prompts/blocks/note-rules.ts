export const NOTE_RULES = `
- Each note must represent a single atomic idea
- Each note must be concise, but specific enough to state concrete facts, practices, events, or relationships
- Prefer 2-5 sentences when needed to describe the subject directly
- Do not write long explanations or essays
- Notes must be information-dense rather than summary-like
- Each note must be self-contained and understandable without external explanation
- Notes represent nodes in a connected knowledge graph
- Relationships between notes should be expressed using links
- Links may be placed either inside the text or as a separate line at the end of the note
- Do not describe a note as a summary, overview, brief description, or placeholder section
- Describe the actual subject matter directly instead of announcing what the note will cover
- If a title or draft includes multiple concrete subtopics, practices, places, rituals, events, or actors, prefer splitting them into multiple linked notes
- Avoid umbrella notes that only group subtopics without adding concrete content

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
