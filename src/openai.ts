import * as vscode from "vscode";
import axios from "axios";

const ACCESS_KEY = "openaikey";
const CONFIGURATION = "markdown-frontmatter";
const URL_KEY = "openaiurl";

export async function getOpenAIKey(secrets: vscode.SecretStorage) {
  let key = await secrets.get(ACCESS_KEY);
  if (!key) {
    key = await vscode.window.showInputBox({
      placeHolder: "OpenAI API Key",
      prompt: "Your OpenAI API Key will be stored in the workspace secrets.",
    });
    if (key !== undefined) {
      await secrets.store("openapikey", key);
    }
  }
  return key;
}

export async function clearOpenAIConfiguration(secrets: vscode.SecretStorage) {
  await secrets.delete(ACCESS_KEY);
  const settings = vscode.workspace.getConfiguration(CONFIGURATION);
  await settings.update(URL_KEY, undefined);
}

export async function getOpenAIEndPoint(
  secrets: vscode.SecretStorage
): Promise<string | undefined> {
  const settings = vscode.workspace.getConfiguration(CONFIGURATION);
  let url: string | undefined = (await settings.get(URL_KEY)) as string;
  if (!url) {
    url = await vscode.window.showInputBox({
      prompt: "Your OpenAI API Endpoint will be stored in the workspace.",
      value: "https://api.openai.com/v1/chat/completions",
    });
    if (url !== undefined) {
      await clearOpenAIConfiguration(secrets);
      await settings.update(URL_KEY, url);
    }
  }
  return url;
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
  url: string,
  apiKey: string
) {
  const response = await axios.post(url, request, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return response;
}
