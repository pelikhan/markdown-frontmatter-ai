import { parse, stringify } from "yaml";
import { createChatCompletion } from "./openai";

export interface SeoOptions {
  model?: string;
  openApiKey: string;
  temperature?: number;
}

function tryParseYaml(source: string | undefined) {
  try {
    return source ? parse(source) : {};
  } catch (e) {
    console.log(e);
    return {};
  }
}

export async function generateFrontMatter(
  content: string,
  options: SeoOptions
) {
  const { model = "gpt-3.5-turbo", openApiKey, temperature = 0.0 } = options;

  // parse as markdown
  const m = /^(---\n(?<frontmatter>.*)---\n)?(?<markdown>.*)$/s.exec(content);
  if (!m) return {};
  const { frontmatter, markdown } = m.groups || {};
  if (!markdown) return {};

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
          content: markdown,
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

  const newFrontMatter = {
    ...tryParseYaml(frontmatter),
    title,
    description,
    keywords,
  };

  const output = `---\n${stringify(newFrontMatter)}---\n${markdown}`;

  return { output };
}
