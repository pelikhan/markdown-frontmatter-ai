import * as vscode from "vscode";
import { parse, stringify } from "yaml";
import { createChatCompletion } from "./openai";

export interface SeoOptions {
  model?: string;
  openAiUrl: string;
  openAiKey: string;
  temperature?: number;
  logger: vscode.LogOutputChannel;
}

export async function generateFrontMatter(
  content: string,
  options: SeoOptions
) {
  const {
    model = "gpt-3.5-turbo",
    openAiUrl,
    openAiKey,
    temperature = 0.0,
    logger,
  } = options;

  // parse as markdown
  const m = /^(---\r?\n(?<frontmatter>.*)---\r?\n)?(?<markdown>.*)$/s.exec(
    content
  );
  if (!m) return {};
  const { frontmatter, markdown } = m.groups || {};
  if (!markdown) return {};

  logger.info(`generating frontmatter...`);
  const completion = await createChatCompletion(
    {
      model,
      messages: [
        {
          role: "system",
          content: `You are a front matter generator for mardown. 
- You generate the title, description, keywords for the markdown given by the user
- use yaml format, do not use quotes
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
    openAiUrl,
    openAiKey
  );
  if (completion.status !== 200) {
    logger.error(completion.statusText);
    return { error: completion.statusText };
  }

  logger.info(JSON.stringify(completion.data, null, 2));
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

  function tryParseYaml<T>(source: string | undefined): Partial<T> {
    try {
      const cleaned = source?.replace(/^---\n/, "").replace(/---\n?$/, "");
      return cleaned
        ? (parse(cleaned, {
            prettyErrors: true,
          }) as any)
        : ({} as any);
    } catch (e) {
      logger.debug(e + "");
      return {} as any;
    }
  }
}
