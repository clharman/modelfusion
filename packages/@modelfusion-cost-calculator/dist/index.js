var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/Cost.ts
var Cost = class {
  constructor({
    costInMillicents,
    hasUnknownCost,
    callsWithUnknownCost
  }) {
    __publicField(this, "costInMillicents");
    __publicField(this, "hasUnknownCost");
    __publicField(this, "callsWithUnknownCost");
    this.costInMillicents = costInMillicents;
    this.hasUnknownCost = hasUnknownCost;
    this.callsWithUnknownCost = callsWithUnknownCost;
  }
  get costInCent() {
    return this.costInMillicents / 1e3;
  }
  get costInDollar() {
    return this.costInCent / 100;
  }
  formatAsDollarAmount({ decimals = 2 } = {}) {
    return `$${this.costInDollar.toFixed(decimals)}`;
  }
};

// src/calculateCost.ts
async function calculateCost({
  calls,
  costCalculators
}) {
  let costInMillicents = 0;
  const callsWithUnknownCost = [];
  for (const call of calls) {
    const model = call.model;
    const providerCostCalculator = costCalculators.find(
      (providerCostCalculator2) => providerCostCalculator2.provider === model.provider
    );
    if (!providerCostCalculator) {
      callsWithUnknownCost.push(call);
      continue;
    }
    const cost = await providerCostCalculator.calculateCostInMillicents(call);
    if (cost === null) {
      callsWithUnknownCost.push(call);
      continue;
    }
    costInMillicents += cost;
  }
  return new Cost({
    costInMillicents,
    hasUnknownCost: callsWithUnknownCost.length > 0,
    callsWithUnknownCost
  });
}

// src/openai/calculators/chat.ts
var OPENAI_CHAT_MODEL_COSTS = {
  "gpt-4": {
    promptTokenCostInMillicents: 3,
    completionTokenCostInMillicents: 6
  },
  "gpt-4-0314": {
    promptTokenCostInMillicents: 3,
    completionTokenCostInMillicents: 6
  },
  "gpt-4-0613": {
    promptTokenCostInMillicents: 3,
    completionTokenCostInMillicents: 6,
    fineTunedPromptTokenCostInMillicents: null,
    fineTunedCompletionTokenCostInMillicents: null
  },
  "gpt-4-turbo-preview": {
    promptTokenCostInMillicents: 1,
    completionTokenCostInMillicents: 3
  },
  "gpt-4-1106-preview": {
    promptTokenCostInMillicents: 1,
    completionTokenCostInMillicents: 3
  },
  "gpt-4-0125-preview": {
    promptTokenCostInMillicents: 1,
    completionTokenCostInMillicents: 3
  },
  "gpt-4-vision-preview": {
    promptTokenCostInMillicents: 1,
    completionTokenCostInMillicents: 3
  },
  "gpt-4-32k": {
    promptTokenCostInMillicents: 6,
    completionTokenCostInMillicents: 12
  },
  "gpt-4-32k-0314": {
    promptTokenCostInMillicents: 6,
    completionTokenCostInMillicents: 12
  },
  "gpt-4-32k-0613": {
    promptTokenCostInMillicents: 6,
    completionTokenCostInMillicents: 12
  },
  "gpt-3.5-turbo": {
    promptTokenCostInMillicents: 0.15,
    completionTokenCostInMillicents: 0.2,
    fineTunedPromptTokenCostInMillicents: 0.3,
    fineTunedCompletionTokenCostInMillicents: 0.6
  },
  "gpt-3.5-turbo-0125": {
    promptTokenCostInMillicents: 0.05,
    completionTokenCostInMillicents: 0.15
  },
  "gpt-3.5-turbo-1106": {
    promptTokenCostInMillicents: 0.1,
    completionTokenCostInMillicents: 0.2
  },
  "gpt-3.5-turbo-0301": {
    promptTokenCostInMillicents: 0.15,
    completionTokenCostInMillicents: 0.2
  },
  "gpt-3.5-turbo-0613": {
    promptTokenCostInMillicents: 0.15,
    completionTokenCostInMillicents: 0.2,
    fineTunedPromptTokenCostInMillicents: 1.2,
    fineTunedCompletionTokenCostInMillicents: 1.6
  },
  "gpt-3.5-turbo-16k": {
    promptTokenCostInMillicents: 0.3,
    completionTokenCostInMillicents: 0.4
  },
  "gpt-3.5-turbo-16k-0613": {
    promptTokenCostInMillicents: 0.3,
    completionTokenCostInMillicents: 0.4
  },
  "gpt-4o": {
    promptTokenCostInMillicents: 2,
    completionTokenCostInMillicents: 4
  }
};
var isOpenAIChatModel = (model) => model in OPENAI_CHAT_MODEL_COSTS || model.startsWith("ft:gpt-3.5-turbo-0613:") || model.startsWith("ft:gpt-3.5-turbo:");
var calculateOpenAIChatCostInMillicents = ({
  model,
  response
}) => {
  if (!(model in OPENAI_CHAT_MODEL_COSTS))
    return null;
  const { promptTokenCostInMillicents, completionTokenCostInMillicents } = OPENAI_CHAT_MODEL_COSTS[model];
  return response.usage.prompt_tokens * promptTokenCostInMillicents + response.usage.completion_tokens * completionTokenCostInMillicents;
};

// src/openai/calculators/completions.ts
var OPENAI_TEXT_GENERATION_MODELS = {
  "gpt-3.5-turbo-instruct": {
    promptTokenCostInMillicents: 0.15,
    completionTokenCostInMillicents: 0.2
  }
};
var calculateOpenAICompletionCostInMillicents = ({
  model,
  response
}) => {
  const modelInformation = OPENAI_TEXT_GENERATION_MODELS[model];
  return response.usage.prompt_tokens * modelInformation.promptTokenCostInMillicents + response.usage.completion_tokens * modelInformation.completionTokenCostInMillicents;
};
var isOpenAICompletionModel = (model) => model in OPENAI_TEXT_GENERATION_MODELS;

// src/openai/calculators/embeddings.ts
var EMBEDDING_MODEL_COSTS = {
  "text-embedding-3-small": 2e-3,
  "text-embedding-3-large": 0.013,
  "text-embedding-ada-002": 0.01
};
var isOpenAIEmbeddingModel = (model) => model in EMBEDDING_MODEL_COSTS;
var calculateOpenAIEmbeddingCostInMillicents = ({
  model,
  responses
}) => {
  let amountInMilliseconds = 0;
  for (const response of responses) {
    amountInMilliseconds += response.usage.total_tokens * EMBEDDING_MODEL_COSTS[model];
  }
  return amountInMilliseconds;
};

// src/openai/calculators/images.ts
var OPENAI_IMAGE_MODELS = {
  "dall-e-2": {
    getCost(settings) {
      switch (settings.size ?? "1024x1024") {
        case "1024x1024":
          return 2e3;
        case "512x512":
          return 1800;
        case "256x256":
          return 1600;
        default:
          return null;
      }
    }
  },
  "dall-e-3": {
    getCost(settings) {
      switch (settings.quality ?? "standard") {
        case "standard": {
          switch (settings.size ?? "1024x1024") {
            case "1024x1024":
              return 4e3;
            case "1024x1792":
            case "1792x1024":
              return 8e3;
            default:
              return null;
          }
        }
        case "hd": {
          switch (settings.size ?? "1024x1024") {
            case "1024x1024":
              return 8e3;
            case "1024x1792":
            case "1792x1024":
              return 12e3;
            default:
              return null;
          }
        }
      }
    }
  }
};
var calculateOpenAIImageGenerationCostInMillicents = ({
  model,
  settings
}) => {
  const cost = OPENAI_IMAGE_MODELS[model]?.getCost(settings);
  if (cost == null) {
    return null;
  }
  return (settings.numberOfGenerations ?? 1) * cost;
};

// src/openai/calculators/speech.ts
var SpeechModelCosts = {
  "tts-1": 1.5,
  // = 1500 / 1000,
  "tts-1-hd": 3
  // = 3000 / 1000
};
var calculateOpenAISpeechCostInMillicents = ({
  model,
  input
}) => {
  if (!SpeechModelCosts[model]) {
    return null;
  }
  return input.length * SpeechModelCosts[model];
};

// src/openai/calculators/transcription.ts
var TRANSCRIPTION_MODEL_COSTS = {
  "whisper-1": 10
  // = 600 / 60,
};
var calculateOpenAITranscriptionCostInMillicents = ({
  model,
  response
}) => {
  if (model !== "whisper-1") {
    return null;
  }
  const durationInSeconds = response.duration;
  return Math.ceil(durationInSeconds) * TRANSCRIPTION_MODEL_COSTS[model];
};

// src/openai/OpenAICostCalculator.ts
var OpenAICostCalculator = class {
  constructor() {
    __publicField(this, "provider", "openai");
  }
  async calculateCostInMillicents(call) {
    const { model, functionType, result } = call;
    const { modelName } = model;
    const { rawResponse } = result;
    switch (functionType) {
      case "generate-image": {
        if (modelName == null) {
          return null;
        }
        return calculateOpenAIImageGenerationCostInMillicents({
          model: modelName,
          settings: call.settings
        });
      }
      case "embed": {
        if (modelName == null) {
          return null;
        }
        if (isOpenAIEmbeddingModel(modelName)) {
          const responses = Array.isArray(call.result.rawResponse) ? rawResponse : [rawResponse];
          return calculateOpenAIEmbeddingCostInMillicents({
            model: modelName,
            responses
          });
        }
        break;
      }
      case "generate-object":
      case "generate-text": {
        if (modelName == null) {
          return null;
        }
        if (isOpenAIChatModel(modelName)) {
          return calculateOpenAIChatCostInMillicents({
            model: modelName,
            response: rawResponse
          });
        }
        if (isOpenAICompletionModel(modelName)) {
          return calculateOpenAICompletionCostInMillicents({
            model: modelName,
            response: rawResponse
          });
        }
        break;
      }
      case "generate-transcription": {
        if (modelName == null) {
          return null;
        }
        return calculateOpenAITranscriptionCostInMillicents({
          model: modelName,
          response: call.result.rawResponse
        });
      }
      case "generate-speech": {
        if (modelName == null) {
          return null;
        }
        return calculateOpenAISpeechCostInMillicents({
          model: modelName,
          input: call.input
        });
      }
    }
    return null;
  }
};
export {
  Cost,
  OpenAICostCalculator,
  calculateCost
};
//# sourceMappingURL=index.js.map