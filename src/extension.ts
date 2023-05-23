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
        if (!editor) return;

        const content = editor?.document?.getText();
        if (!content) return;

        const openApiKey = await getOpenApiKey(secrets);
        if (!openApiKey) return;

        vscode.window.withProgress(
          {
            title: "Markdown: Generating frontmatter...",
            location: vscode.ProgressLocation.Notification,
          },
          async () => {
            const { output, error } = await generateFrontMatter(content, {
              openApiKey,
            });
            if (error) {
              vscode.window.showErrorMessage(error);
              return;
            }
            if (!output) return;

            editor.edit((editBuilder) => {
              const fullRange = new vscode.Range(
                0,
                0,
                editor.document.lineCount,
                editor.document.lineAt(
                  editor.document.lineCount - 1
                ).text.length
              );
              editBuilder.replace(fullRange, output);
            });
          }
        );
      }
    )
  );
}
