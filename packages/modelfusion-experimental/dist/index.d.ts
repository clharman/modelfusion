import { FunctionOptions, SplitFunction, Run, TextGenerationModel, FullTokenizer, ObjectValidationError, ObjectParseError } from 'modelfusion';
import { ExtensionFunctionStartedEvent, ExtensionFunctionFinishedEvent } from 'modelfusion/internal';

type SummarizationFunction = (input: {
    text: string;
}, options?: FunctionOptions) => PromiseLike<string>;

declare function summarizeRecursively({ summarize, split, join, text, }: {
    summarize: SummarizationFunction;
    split: SplitFunction;
    join?: (texts: Array<string>) => string;
    text: string;
}, options?: {
    run?: Run;
}): Promise<string>;

/**
 * Recursively summarizes a text using a text generation model, e.g. for summarization or text extraction.
 * It automatically splits the text into optimal chunks that are small enough to be processed by the model,
 * while leaving enough space for the model to generate text.
 */
declare function summarizeRecursivelyWithTextGenerationAndTokenSplitting<PROMPT>({ text, model, prompt, tokenLimit, join, }: {
    text: string;
    model: TextGenerationModel<PROMPT> & {
        contextWindowSize: number;
        tokenizer: FullTokenizer;
        countPromptTokens: (prompt: PROMPT) => PromiseLike<number>;
    };
    prompt: (input: {
        text: string;
    }) => Promise<PROMPT>;
    tokenLimit?: number;
    join?: (texts: Array<string>) => string;
}, options?: {
    functionId?: string;
    run?: Run;
}): Promise<string>;

interface GuardStartedEvent extends ExtensionFunctionStartedEvent {
    extension: "guard";
}
interface GuardFinishedEvent extends ExtensionFunctionFinishedEvent {
    extension: "guard";
}

type OutputResult<INPUT, OUTPUT> = {
    type: "value";
    input: INPUT;
    output: OUTPUT;
    error?: undefined;
} | {
    type: "error";
    input: INPUT;
    output?: undefined;
    error: unknown;
};
type OutputValidator<INPUT, OUTPUT> = ({ type, input, output, error, }: OutputResult<INPUT, OUTPUT>) => PromiseLike<boolean>;
type Guard<INPUT, OUTPUT> = ({ type, input, output, error, }: OutputResult<INPUT, OUTPUT>) => PromiseLike<{
    action: "retry";
    input: INPUT;
} | {
    action: "return";
    output: OUTPUT;
} | {
    action: "throwError";
    error: unknown;
} | {
    action: "passThrough";
} | undefined>;
declare function guard<INPUT, OUTPUT>(execute: (input: INPUT, options?: FunctionOptions) => PromiseLike<OUTPUT>, input: INPUT, guards: Guard<INPUT, OUTPUT> | Array<Guard<INPUT, OUTPUT>>, options?: FunctionOptions & {
    maxAttempts: number;
}): Promise<OUTPUT | undefined>;

/**
 * Attempts to correct and retry object generation when encountering parsing or validation errors.
 *
 * This function acts as a guard within the object generation process. If the generation results in
 * an error, identified as either a `ObjectParseError` or `ObjectValidationError`, the function
 * triggers a retry mechanism. It uses the `modifyInputForRetry` method, provided via options, to adjust
 * the input parameters, aiming to resolve the issue that caused the initial error. The process continues
 * until a valid object is generated, or it exhausts the predefined retry limits.
 *
 * @template INPUT - The expected format/type of the input data used for object generation.
 * @template OUTPUT - The expected format/type of the output data, i.e., the successfully generated object.
 *
 * @param {Object} options - Configuration options for modifying the input before retrying object generation.
 * @param {function} options.modifyInputForRetry - A function that takes the error type, original input, and error object.
 *        It modifies the input data based on the error information, aiming to correct the issue for the retry attempt.
 *        This function must return a promise that resolves with the modified input.
 *
 * @returns {Guard<INPUT, OUTPUT>} A guard function that intercepts the object generation process, checking for
 *          errors, and initiating retries by modifying the input parameters. The guard can trigger multiple retries
 *          if the issues persist. If the process succeeds, it returns the valid object; otherwise, it returns
 *          undefined, indicating the exhaustion of retry attempts or a non-recoverable error.
 *
 * @example
 * const result = await guard(
 *  (input) =>
 *    generateObject(
 *      openai
 *        .ChatTextGenerator(/* ... * /)
 *        .asFunctionCallObjectGenerationModel(/* ... * /),
 *
 *      zodSchema({
 *        // ...
 *      }),
 *
 *      input
 *    ),
 *  [
 *    // ...
 *  ],
 *  fixObject({
 *    modifyInputForRetry: async ({ input, error }) => [
 *      ...input,
 *      openai.ChatMessage.assistant(null, {
 *        functionCall: {
 *          name: "sentiment",
 *          arguments: JSON.stringify(error.valueText),
 *        },
 *      }),
 *      openai.ChatMessage.user(error.message),
 *      openai.ChatMessage.user("Please fix the error and try again."),
 *    ],
 *  })
 * );
 */
declare const fixObject: <INPUT, OUTPUT>(options: {
    modifyInputForRetry: (options: {
        type: "error";
        input: INPUT;
        error: ObjectValidationError | ObjectParseError;
    }) => PromiseLike<INPUT>;
}) => Guard<INPUT, OUTPUT>;

export { type Guard, type GuardFinishedEvent, type GuardStartedEvent, type OutputValidator, type SummarizationFunction, fixObject, guard, summarizeRecursively, summarizeRecursivelyWithTextGenerationAndTokenSplitting };
