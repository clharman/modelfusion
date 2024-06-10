"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  fixObject: () => fixObject,
  guard: () => guard,
  summarizeRecursively: () => summarizeRecursively,
  summarizeRecursivelyWithTextGenerationAndTokenSplitting: () => summarizeRecursivelyWithTextGenerationAndTokenSplitting
});
module.exports = __toCommonJS(src_exports);

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
var import_modelfusion = require("modelfusion");
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
      split: (0, import_modelfusion.splitAtToken)({
        tokenizer: model.tokenizer,
        maxTokensPerChunk: tokenLimit - emptyPromptTokens
      }),
      summarize: async (input) => (0, import_modelfusion.generateText)({ model, prompt: await prompt(input), ...options }),
      join,
      text
    },
    options
  );
}

// src/guard/fixObject.ts
var import_modelfusion2 = require("modelfusion");
var fixObject = ({ modifyInputForRetry }) => async (result) => {
  if (result.type === "error" && (result.error instanceof import_modelfusion2.ObjectValidationError || result.error instanceof import_modelfusion2.ObjectParseError)) {
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
var import_internal = require("modelfusion/internal");
async function guard(execute, input, guards, options) {
  const guardList = Array.isArray(guards) ? guards : [guards];
  const maxAttempts = options?.maxAttempts ?? 2;
  return (0, import_internal.executeFunctionCall)({
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  fixObject,
  guard,
  summarizeRecursively,
  summarizeRecursivelyWithTextGenerationAndTokenSplitting
});
//# sourceMappingURL=index.cjs.map