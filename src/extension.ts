import * as vscode from "vscode";
import { getOpenAIKey, clearOpenAIConfiguration, getOpenAIEndPoint } from "./openai";
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
        await clearOpenAIConfiguration(secrets);
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

        const openAiUrl = await getOpenAIEndPoint(secrets);
        if (!openAiUrl) return;

        const openAiKey = await getOpenAIKey(secrets);
        if (!openAiKey) return;

        vscode.window.withProgress(
          {
            title: "Markdown: Generating frontmatter...",
            location: vscode.ProgressLocation.Notification,
          },
          async () => {
            const { output, error } = await generateFrontMatter(content, {
              openAiUrl,
              openAiKey,
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
