import { read } from "to-vfile";
import { program } from "commander";
import { writeFileSync } from "fs";
import { generateFrontMatter } from "./frontmatter.js";

interface SeoOptions {
  model?: string;
}

const actionSeo = async (filename: string, options: SeoOptions) => {
  const file = await read(filename);
  const { modified, output } = await generateFrontMatter(file, {
    ...options,
    openApiKey: process.env.OPENAI_API_KEY,
  });

  // write back to file
  if (modified) {
    console.log(`writing to ${filename}`);
    writeFileSync(filename, String(output), { encoding: "utf-8" });
  }
};

(async function main() {
  program
    .command("seo", { isDefault: true })
    .description("generate description from markdown file")
    .argument("<string>", "filename")
    .option("-m, --model", "openai model", "gpt-3.5-turbo")
    .action(actionSeo);
  program.parse();
})();
