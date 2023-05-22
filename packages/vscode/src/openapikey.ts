import * as vscode from "vscode";

export async function getOpenApiKey(secrets: vscode.SecretStorage) {
  let key = await secrets.get("openapikey");
  if (!key) {
    key = await vscode.window.showInputBox({
      placeHolder: "OpenAI API Key",
      prompt: "Your OpenAI API Key will be stored in the workspace secrets.",
    });
    if (key !== undefined) {
      await storeOpenApiKey(secrets, key);
    }
  }
  return key;
}

export async function storeOpenApiKey(
  secrets: vscode.SecretStorage,
  value: string
) {
  await secrets.store("openapikey", value);
}
