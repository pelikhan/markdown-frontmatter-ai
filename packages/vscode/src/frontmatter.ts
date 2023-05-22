import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkStringify from "remark-stringify";
import { parse, stringify } from "yaml";
import { Root, YAML } from "mdast";
import { toMarkdown } from "mdast-util-to-markdown";
import { createChatCompletion } from "./openai";

export interface SeoOptions {
  model?: string;
  openApiKey: string;
}

export async function generateFrontMatter(
  content: string,
  options: SeoOptions
) {
  const { model = "gpt-3.5-turbo", openApiKey } = options;
  const temperature = 0.0;

  // read file
  let modified = false;

  // parse as markdown
  const out = await unified()
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkFrontmatter, ["yaml"])
    .use(() => async (root: Root) => {
      const node = root.children[0]?.type === "yaml";
      if (node) {
        const node = root.children[0] as YAML;
        const frontmatter = parse(node.value);

        const rootNoFrontMatter = JSON.parse(JSON.stringify(root));
        rootNoFrontMatter.children.pop(); // ignore previous frontmatter

        const promptMarkdown = toMarkdown(rootNoFrontMatter, {
          handlers: {
            yaml: (node: YAML) => node.value,
          },
        });

        console.log(`generating frontmatter...`);
        const completion = await createChatCompletion(
          {
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
          },
          openApiKey
        );
        const fm = completion.data?.choices?.[0]?.message?.content;
        const ryaml = parse(fm!.replace(/^---/, "").replace(/---$/, ""), {
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
        }
      }
    })
    .process(content);

  const output = String(out);
  console.log(output);
  return { modified, output };
}
