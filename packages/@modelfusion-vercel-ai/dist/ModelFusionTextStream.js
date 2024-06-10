import { createCallbacksTransformer, createStreamDataTransformer, readableFromAsyncIterable, } from "ai";
export function ModelFusionTextStream(stream, callbacks) {
    return readableFromAsyncIterable(stream)
        .pipeThrough(createCallbacksTransformer(callbacks))
        .pipeThrough(createStreamDataTransformer(callbacks?.experimental_streamData));
}
