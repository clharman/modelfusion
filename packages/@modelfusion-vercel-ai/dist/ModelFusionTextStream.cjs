"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelFusionTextStream = void 0;
const ai_1 = require("ai");
function ModelFusionTextStream(stream, callbacks) {
    return (0, ai_1.readableFromAsyncIterable)(stream)
        .pipeThrough((0, ai_1.createCallbacksTransformer)(callbacks))
        .pipeThrough((0, ai_1.createStreamDataTransformer)(callbacks?.experimental_streamData));
}
exports.ModelFusionTextStream = ModelFusionTextStream;
