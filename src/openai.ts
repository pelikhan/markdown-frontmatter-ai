import * as vscode from "vscode";
import axios from "axios";

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

export interface CreateChatCompletionRequest {
  temperature?: number;
  max_tokens?: number;
  n?: number;
  stop?: string | string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  engine?: string;
  user?: string;
  model: string;
  metadata?: Record<string, any>;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
    name?: string;
  }[];
}

export async function createChatCompletion(
  request: CreateChatCompletionRequest,
  apiKey: string
) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    request,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  return response;
}
