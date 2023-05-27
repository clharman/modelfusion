import { createJsonResponseHandler, postToOpenAI } from "../postToOpenAI.js";
import {
  OpenAIChatMessage,
  OpenAIChatCompletion,
  openAIChatCompletionSchema,
} from "./OpenAIChatCompletion.js";
import { OpenAIChatModelType } from "./OpenAIChatModel.js";

export async function generateOpenAIChatCompletion({
  baseUrl = "https://api.openai.com/v1",
  abortSignal,
  apiKey,
  model,
  messages,
  temperature,
  topP,
  n,
  stop,
  maxCompletionTokens,
  presencePenalty,
  frequencyPenalty,
  user,
}: {
  baseUrl?: string;
  abortSignal?: AbortSignal;
  apiKey: string;
  model: OpenAIChatModelType;
  messages: Array<OpenAIChatMessage>;
  temperature?: number;
  topP?: number;
  n?: number;
  stop?: string | string[];
  maxCompletionTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  user?: string;
}): Promise<OpenAIChatCompletion> {
  return postToOpenAI({
    url: `${baseUrl}/chat/completions`,
    apiKey,
    body: {
      model,
      messages,
      top_p: topP,
      n,
      stop,
      max_tokens: maxCompletionTokens,
      temperature,
      presence_penalty: presencePenalty,
      frequency_penalty: frequencyPenalty,
      user,
    },
    successfulResponseHandler: createJsonResponseHandler(
      openAIChatCompletionSchema
    ),
    abortSignal,
  });
}