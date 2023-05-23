# Markdown Frontmatter AI

Visual Studio Code extension that generates title, description and keywords for the current markdown file
using OpenAI (gpt3.5turbo).

Supports frontmatter `---` with `yaml` entries.

## Usage

- open a markdown file (or mdx)
- press `ctrl+shift+p` and type `Generate Frontmatter`
- press `enter` and wait for the magic to happen. If successful, the file will be updated with the new frontmatter.

## OpenAI Key

An OpenAI key is needed to run the extension.

If this your first time running, you will be asked to enter your OpenAI API key. The key is stored in the workspace secrets (see `openai.ts/getOpenAIKey`).

To clear the key, run the command `Clear OpenAI Key` from the command palette.
