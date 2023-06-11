import { TikTokenTokenizer } from "ai-utils.js";

(async () => {
  const tokenizer = new TikTokenTokenizer({ model: "gpt-4" });

  const text = "At first, Nox didn't know what to do with the pup.";

  const tokenCount = await tokenizer.countTokens(text);
  const tokens = await tokenizer.tokenize(text);
  const tokensAndTokenTexts = await tokenizer.tokenizeWithTexts(text);
  const reconstructedText = await tokenizer.detokenize(tokens);

  console.log("countTokens", tokenCount);
  console.log("tokenize", tokens);
  console.log("tokenizeWithTexts", tokensAndTokenTexts);
  console.log("detokenize(tokenize)", reconstructedText);
})();
