import fs from "fs";

let stream: fs.WriteStream | null = null;

export const writeToFile = async (filename: string, content: string[]) => {
  if (!stream) {
    // Create or Open the file for appending

    stream = fs.createWriteStream(filename, { flags: "w" });
  }

  if (!stream) {
    throw new Error("Failed to create file stream");
  }

  for (const line of content) {
    await stream.write(line + "\n");
  }

  stream.close();
};
