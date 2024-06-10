// src/composed-function/summarize/summarizeRecursively.ts
async function summarizeRecursively({
  summarize,
  split,
  join = (texts) => texts.join("\n\n"),
  text
}, options) {
  const chunks = await split({ text });
  const summarizedTexts = await Promise.all(
    chunks.map((chunk) => summarize({ text: chunk }, options))
  );
  if (summarizedTexts.length === 1) {
    return summarizedTexts[0];
  }
  return summarizeRecursively(
    {
      text: join(summarizedTexts),
      summarize,
      split,
      join
    },
    options
  );
}

// src/composed-function/summarize/summarizeRecursivelyWithTextGenerationAndTokenSplitting.ts
import {
  generateText,
  splitAtToken
} from "modelfusion";
async function summarizeRecursivelyWithTextGenerationAndTokenSplitting({
  text,
  model,
  prompt,
  tokenLimit = model.contextWindowSize - (model.settings.maxGenerationTokens ?? model.contextWindowSize / 4),
  join
}, options) {
  const emptyPromptTokens = await model.countPromptTokens(
    await prompt({ text: "" })
  );
  return summarizeRecursively(
    {
      split: splitAtToken({
        tokenizer: model.tokenizer,
        maxTokensPerChunk: tokenLimit - emptyPromptTokens
      }),
      summarize: async (input) => generateText({ model, prompt: await prompt(input), ...options }),
      join,
      text
    },
    options
  );
}

// src/guard/fixObject.ts
import { ObjectParseError, ObjectValidationError } from "modelfusion";
var fixObject = ({ modifyInputForRetry }) => async (result) => {
  if (result.type === "error" && (result.error instanceof ObjectValidationError || result.error instanceof ObjectParseError)) {
    return {
      action: "retry",
      input: await modifyInputForRetry({
        type: "error",
        input: result.input,
        error: result.error
      })
    };
  }
  return void 0;
};

// src/guard/guard.ts
import { executeFunctionCall } from "modelfusion/internal";
async function guard(execute, input, guards, options) {
  const guardList = Array.isArray(guards) ? guards : [guards];
  const maxAttempts = options?.maxAttempts ?? 2;
  return executeFunctionCall({
    options,
    input,
    functionType: "extension",
    execute: async (options2) => {
      let attempts = 0;
      while (attempts < maxAttempts) {
        let result;
        try {
          result = {
            type: "value",
            input,
            output: await execute(input, options2)
          };
        } catch (error) {
          result = {
            type: "error",
            input,
            error
          };
        }
        let isValid = true;
        for (const guard2 of guardList) {
          const guardResult = await guard2(result);
          if (guardResult === void 0) {
            continue;
          }
          switch (guardResult.action) {
            case "passThrough": {
              break;
            }
            case "retry": {
              input = guardResult.input;
              isValid = false;
              break;
            }
            case "return": {
              result = {
                type: "value",
                input,
                output: guardResult.output
              };
              break;
            }
            case "throwError": {
              result = {
                type: "error",
                input,
                error: guardResult.error
              };
              break;
            }
          }
        }
        if (isValid) {
          if (result.type === "value") {
            return result.output;
          } else {
            throw result.error;
          }
        }
        attempts++;
      }
      throw new Error(
        `Maximum attempts of ${maxAttempts} reached without producing a valid output or handling an error.`
      );
    }
  });
}
export {
  fixObject,
  guard,
  summarizeRecursively,
  summarizeRecursivelyWithTextGenerationAndTokenSplitting
};
//# sourceMappingURL=index.js.map