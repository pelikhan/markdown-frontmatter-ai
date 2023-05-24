import * as vscode from "vscode";
import {
  getOpenAIKey,
  clearOpenAIConfiguration,
  getOpenAIEndPoint,
} from "./openai";
import { generateFrontMatter } from "./frontmatter";
import { AxiosError } from "axios";
import { Utils } from "vscode-uri";

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
        const document = editor.document;
        if (!document) return;

        const content = document?.getText();
        if (!content) return;

        const openAiUrl = await getOpenAIEndPoint(secrets);
        if (!openAiUrl) return;

        const openAiKey = await getOpenAIKey(secrets);
        if (!openAiKey) return;

        vscode.window.withProgress(
          {
            title: `Markdown: Generating frontmatter for ${Utils.basename(
              document.uri
            )}...`,
            location: vscode.ProgressLocation.Notification,
          },
          async () => {
            const { output, error } = await generateFrontMatter(content, {
              openAiUrl,
              openAiKey,
              logger,
            });
            if (error) {
              if (error instanceof AxiosError) {
                const statusCode = error.status;
                switch (statusCode) {
                  case 429:
                    vscode.window.showErrorMessage(
                      "Rate limit exceeded. Please try again later."
                    );
                    return;
                }
              }
              vscode.window.showErrorMessage(error + "");
              return;
            }
            if (!output) return;
            if (output === content) return; // no changes

            vscode.workspace.fs.writeFile(document.uri, Buffer.from(output));
          }
        );
      }
    )
  );
}
