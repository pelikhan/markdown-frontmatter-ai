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
  const m =
    /^(---\s*\r?\n(?<frontmatter>.*)---\s*\r?\n?)?(?<markdown>.*)$/s.exec(
      content
    );
  if (!m) return {};
  const { frontmatter, markdown } = m.groups || {};
  if (!markdown) return {};

  logger.info(`generating frontmatter...`);
  const { response: completion, error } = await createChatCompletion(
    {
      model,
      messages: [
        {
          role: "system",
          content: `You are a helpful front matter generator for mardown. You are an SEO expert.
- You generate the title, description and keywords for the markdown given by the user
- use yaml format, do not use quotes
- do not generate the \`---\` fences
- only 5 keywords or less
- optimize for search engine optimization
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
  if (error) {
    logger.error(error + "");
    return { error };
  } else if (!completion) {
    return { error: "no response" };
  }

  logger.info(JSON.stringify(completion.data, null, 2));
  const fm = completion.data?.choices?.[0]?.message?.content;
  const ryaml = tryParseYaml<{
    title: string;
    description: string;
    keywords: string | string[];
  }>(fm);
  const { title, description, keywords: keywordsAll } = ryaml;

  const keywords =
    typeof keywordsAll === "string"
      ? keywordsAll?.split(/,\s*/g).slice(0, 5)
      : keywordsAll;
  const yf = tryParseYaml(frontmatter);
  const newFrontMatter = {
    ...yf,
    //title,
    description,
    keywords,
  };

  const output = `---\n${stringify(newFrontMatter)}---\n${markdown}`;

  return { output };

  function tryParseYaml<T>(source: string | undefined): Partial<T> {
    try {
      const cleaned = source
        ?.replace(/^---\s*\r?\n/, "")
        .replace(/---\s*\n?$/, "");
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
