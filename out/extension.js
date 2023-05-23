"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const openai_1 = require("./openai");
const frontmatter_1 = require("./frontmatter");
function activate(context) {
    const { secrets } = context;
    context.subscriptions.push(vscode.commands.registerCommand("extension.markdownai.frontmatter.generate", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const content = editor?.document?.getText();
        if (!content)
            return;
        const openApiKey = await (0, openai_1.getOpenApiKey)(secrets);
        if (!openApiKey)
            return;
        vscode.window.withProgress({
            title: "Markdown: Generating frontmatter...",
            location: vscode.ProgressLocation.Notification,
        }, async () => {
            const { output, error } = await (0, frontmatter_1.generateFrontMatter)(content, {
                openApiKey,
            });
            if (error) {
                vscode.window.showErrorMessage(error);
                return;
            }
            if (!output)
                return;
            editor.edit((editBuilder) => {
                const fullRange = new vscode.Range(0, 0, editor.document.lineCount, editor.document.lineAt(editor.document.lineCount - 1).text.length);
                editBuilder.replace(fullRange, output);
            });
        });
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map