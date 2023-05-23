"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatCompletion = exports.storeOpenApiKey = exports.getOpenApiKey = void 0;
const vscode = require("vscode");
const axios_1 = require("axios");
async function getOpenApiKey(secrets) {
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
exports.getOpenApiKey = getOpenApiKey;
async function storeOpenApiKey(secrets, value) {
    await secrets.store("openapikey", value);
}
exports.storeOpenApiKey = storeOpenApiKey;
async function createChatCompletion(request, apiKey) {
    const response = await axios_1.default.post("https://api.openai.com/v1/chat/completions", request, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
    });
    return response;
}
exports.createChatCompletion = createChatCompletion;
//# sourceMappingURL=openai.js.map