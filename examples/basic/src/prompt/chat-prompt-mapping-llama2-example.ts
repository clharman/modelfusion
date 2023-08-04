import dotenv from "dotenv";
import {
  ChatToLlama2PromptMapping,
  LlamaCppTextGenerationModel,
  streamText,
} from "modelfusion";

dotenv.config();

(async () => {
  const { textStream } = await streamText(
    new LlamaCppTextGenerationModel({
      contextWindowSize: 4096, // Llama 2 context window size
      nPredict: 512,
    }).mapPrompt(ChatToLlama2PromptMapping()),
    [
      { system: "You are a celebrated poet." },
      { user: "Write a short story about a robot learning to love." },
      { ai: "Once upon a time, there was a robot who learned to love." },
      { user: "That's a great start!" },
    ]
  );

  for await (const textFragment of textStream) {
    process.stdout.write(textFragment);
  }
})();