export type PromptSection = {
  title: string;
  content: string;
};

type PromptPreset = {
  task: string
  metaSpec: string
}

export type BuildPromptInput = {
  preset: PromptPreset;
  context: string;
  input: string;
};

