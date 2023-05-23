import * as vscode from "vscode";
import { getOpenAIKey, clearOpenAIKey } from "./openai";
import { generateFrontMatter } from "./frontmatter";

export function activate(context: vscode.ExtensionContext) {
  const { secrets } = context;

  const logger = vscode.window.createOutputChannel(
    "Markdown Frontmatter Generator",
    {
      log: true,
    }
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.markdownai.openai.clearKey",
      async () => {
        await clearOpenAIKey(secrets);
        vscode.window.showInformationMessage("OpenAI key cleared");
      }
    ),
    vscode.commands.registerCommand(
      "extension.markdownai.frontmatter.generate",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const content = editor?.document?.getText();
        if (!content) return;

        const openApiKey = await getOpenAIKey(secrets);
        if (!openApiKey) return;

        vscode.window.withProgress(
          {
            title: "Markdown: Generating frontmatter...",
            location: vscode.ProgressLocation.Notification,
          },
          async () => {
            const { output, error } = await generateFrontMatter(content, {
              openApiKey,
              logger,
            });
            if (error) {
              vscode.window.showErrorMessage(error);
              return;
            }
            if (!output) return;
            if (output === content) return; // no changes

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
