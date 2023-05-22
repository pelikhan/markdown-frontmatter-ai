import { Configuration, OpenAIApi } from "openai";
import { read } from "to-vfile";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkStringify from "remark-stringify";
import { program } from "commander";
import { writeFileSync } from "fs";
/*
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const completion = await openai.createCompletion({
  model: "text-davinci-003",
  prompt: "Hello world",
});
console.log(completion.data.choices[0].text);
*/
interface SeoOptions {}

const actionSeo = async (filename: string, options: SeoOptions) => {
  console.log(filename);

  // read file
  const file = await read(filename);
  let modified = false;

  // parse as markdown
  const res = await unified()
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkFrontmatter, ["yaml", "toml"])
    .use(() => (tree) => {
      console.dir(tree);

      // transform frontmatter
    })
    .process(file);

  // write back to file
  if (modified) {
    writeFileSync(filename, String(res), { encoding: "utf-8" });
  }
};

(async function main() {
  program
    .command("seo", { isDefault: true })
    .argument("<string>", "filename")
    .description("generate description from markdown file")
    .action(actionSeo);
  program.parse();
})();
