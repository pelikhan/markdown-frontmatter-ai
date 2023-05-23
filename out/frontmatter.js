"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFrontMatter = void 0;
const yaml_1 = require("yaml");
const openai_1 = require("./openai");
function tryParseYaml(source) {
    try {
        const cleaned = source?.replace(/^---\n/, "").replace(/---\n?$/, "");
        return cleaned
            ? (0, yaml_1.parse)(cleaned, {
                prettyErrors: true,
            })
            : {};
    }
    catch (e) {
        console.log(e);
        return {};
    }
}
async function generateFrontMatter(content, options) {
    const { model = "gpt-3.5-turbo", openApiKey, temperature = 0.0 } = options;
    // parse as markdown
    const m = /^(---\n(?<frontmatter>.*)---\n)?(?<markdown>.*)$/s.exec(content);
    if (!m)
        return {};
    const { frontmatter, markdown } = m.groups || {};
    if (!markdown)
        return {};
    console.log(`generating frontmatter...`);
    const completion = await (0, openai_1.createChatCompletion)({
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
    }, openApiKey);
    if (completion.status !== 200) {
        console.log(completion.data);
        return { error: completion.statusText };
    }
    const fm = completion.data?.choices?.[0]?.message?.content;
    const ryaml = tryParseYaml(fm);
    const { title, description, keywords } = ryaml;
    const newFrontMatter = {
        ...tryParseYaml(frontmatter),
        title,
        description,
        keywords,
    };
    const output = `---\n${(0, yaml_1.stringify)(newFrontMatter)}---\n${markdown}`;
    return { output };
}
exports.generateFrontMatter = generateFrontMatter;
//# sourceMappingURL=frontmatter.js.map