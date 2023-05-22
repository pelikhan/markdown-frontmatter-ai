import * as vscode from "vscode";
import { getOpenApiKey, storeOpenApiKey, createChatCompletion } from "./openai";
import { generateFrontMatter } from "./frontmatter";

export function activate(context: vscode.ExtensionContext) {
  const { secrets } = context;

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.markdownai.frontmatter.generate",
      async () => {
        const editor = vscode.window.activeTextEditor;
        const content = editor?.document?.getText();
        if (!content) return;

        const openApiKey = await getOpenApiKey(secrets);
        if (!openApiKey) return;

        const { modified, output } = await generateFrontMatter(content, {
          openApiKey,
        });
        console.log(output);

        editor!.edit((editBuilder) => {});
      }
    )
  );
}
