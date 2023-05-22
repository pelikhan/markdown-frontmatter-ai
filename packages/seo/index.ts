import { Configuration, OpenAIApi } from "openai";
import { read } from "to-vfile";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkStringify from "remark-stringify";
import { program } from "commander";
import { writeFileSync } from "fs";
import { parse, stringify } from "yaml";
import { Root, YAML } from "mdast";
import { toMarkdown } from "mdast-util-to-markdown";

interface SeoOptions {
  model?: string;
}

const actionSeo = async (filename: string, options: SeoOptions) => {
  console.log(filename);
  const { model = "gpt-3.5-turbo" } = options;
  const temperature = 0.0;

  // read file
  const file = await read(filename);
  let modified = false;

  // parse as markdown
  const res = await unified()
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkFrontmatter, ["yaml"])
    .use(() => async (root: Root) => {
      const node = root.children[0]?.type === "yaml";
      if (node) {
        const node = root.children[0] as YAML;
        const frontmatter = parse(node.value);

        const rootNoFrontMatter = structuredClone(root);
        rootNoFrontMatter.children.pop(); // ignore previous frontmatter

        const promptMarkdown = toMarkdown(rootNoFrontMatter, {
          handlers: {
            yaml: (node: YAML) => node.value,
          },
        });
        const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const completion = await openai.createChatCompletion({
          model,
          messages: [
            {
              role: "system",
              content: `You are a front matter generator for mardown. 
- You generate the title, description, keywords for the markdown given by the user
- use yaml format 
- do not generate the \`---\` fences
- optimize for SEO
`,
            },
            {
              role: "user",
              content: promptMarkdown,
            },
          ],
          temperature,
        });
        const fm = completion.data.choices[0].message.content;
        console.log(fm);
        const ryaml = parse(fm.replace(/^---/, "").replace(/---$/, ""), {
          prettyErrors: true,
        }) as {
          title: string;
          description: string;
          keywords: string;
        };
        const { title, description, keywords } = ryaml;

        const newFrontMatter = { ...frontmatter, title, description, keywords };
        if (JSON.stringify(frontmatter) !== JSON.stringify(newFrontMatter)) {
          node.value = stringify(newFrontMatter);
          modified = true;
          console.log("modified");
        }
      }
    })
    .process(file);

  // write back to file
  if (modified) {
    console.log(`writing to ${filename}`);
    writeFileSync(filename, String(res), { encoding: "utf-8" });
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
