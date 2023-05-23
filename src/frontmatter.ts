import { parse, stringify } from "yaml";
import { createChatCompletion } from "./openai";

export interface SeoOptions {
  model?: string;
  openApiKey: string;
  temperature?: number;
}

function tryParseYaml<T>(source: string | undefined): Partial<T> {
  try {
    const cleaned = source?.replace(/^---\n/, "").replace(/---\n?$/, "");
    return cleaned
      ? (parse(cleaned, {
          prettyErrors: true,
        }) as any)
      : ({} as any);
  } catch (e) {
    console.log(e);
    return {} as any;
  }
}

export async function generateFrontMatter(
  content: string,
  options: SeoOptions
) {
  const { model = "gpt-3.5-turbo", openApiKey, temperature = 0.0 } = options;

  // parse as markdown
  const m = /^(---\r?\n(?<frontmatter>.*)---\r?\n)?(?<markdown>.*)$/s.exec(
    content
  );
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
  if (completion.status !== 200) {
    console.log(completion.data);
    return { error: completion.statusText };
  }

  const fm = completion.data?.choices?.[0]?.message?.content;
  const ryaml = tryParseYaml<{
    title: string;
    description: string;
    keywords: string;
  }>(fm);
  const { title, description, keywords } = ryaml;

  const yf = tryParseYaml(frontmatter);
  const newFrontMatter = {
    ...yf,
    title,
    description,
    keywords,
  };

  const output = `---\n${stringify(newFrontMatter)}---\n${markdown}`;

  return { output };
}
