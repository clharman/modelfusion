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

// src/browser/index.ts
var browser_exports = {};
__export(browser_exports, {
  MediaSourceAppender: () => MediaSourceAppender,
  convertAudioChunksToBase64: () => convertAudioChunksToBase64,
  convertBlobToBase64: () => convertBlobToBase64,
  invokeFlow: () => invokeFlow,
  readEventSource: () => readEventSource,
  readEventSourceStream: () => readEventSourceStream
});
module.exports = __toCommonJS(browser_exports);

// src/browser/MediaSourceAppender.ts
var MediaSourceAppender = class {
  mediaSource = this.getMediaSource();
  audioChunks = [];
  sourceBuffer;
  getMediaSource() {
    const anyWindow = window.X;
    if (anyWindow.ManagedMediaSource) {
      return new anyWindow.ManagedMediaSource();
    }
    if (anyWindow.MediaSource) {
      return new anyWindow.MediaSource();
    }
    throw "No MediaSource API available";
  }
  constructor(type) {
    this.mediaSource.addEventListener("sourceopen", async () => {
      this.sourceBuffer = this.mediaSource.addSourceBuffer(type);
      this.sourceBuffer?.addEventListener("updateend", () => {
        this.tryAppendNextChunk();
      });
    });
  }
  tryAppendNextChunk() {
    if (this.sourceBuffer != null && !this.sourceBuffer.updating && this.audioChunks.length > 0) {
      this.sourceBuffer.appendBuffer(this.audioChunks.shift());
    }
  }
  addBase64Data(base64Data) {
    this.addData(
      Uint8Array.from(atob(base64Data), (char) => char.charCodeAt(0)).buffer
    );
  }
  addData(data) {
    this.audioChunks.push(data);
    this.tryAppendNextChunk();
  }
  close() {
    if (this.mediaSource.readyState === "open") {
      this.mediaSource.endOfStream();
    }
  }
  get mediaSourceUrl() {
    return URL.createObjectURL(this.mediaSource);
  }
};

// src/browser/convertBlobToBase64.ts
async function convertBlobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        const base64String = btoa(
          new Uint8Array(reader.result).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        resolve(base64String);
      } else {
        reject(new Error("Failed to read blob."));
      }
    };
    reader.onerror = () => {
      reader.abort();
      reject(new DOMException("Problem parsing input blob."));
    };
    reader.readAsArrayBuffer(blob);
  });
}

// src/browser/convertAudioChunksToBase64.ts
function convertAudioChunksToBase64({
  audioChunks,
  mimeType
}) {
  return convertBlobToBase64(new Blob(audioChunks, { type: mimeType }));
}

// src/browser/invokeFlow.ts
var import_modelfusion2 = require("modelfusion");

// src/browser/readEventSource.ts
var import_modelfusion = require("modelfusion");
function readEventSource({
  url,
  schema,
  onEvent,
  onError = console.error,
  onStop,
  isStopEvent
}) {
  const eventSource = new EventSource(url);
  eventSource.onmessage = (event) => {
    try {
      if (isStopEvent?.(event)) {
        eventSource.close();
        onStop?.(eventSource);
        return;
      }
      const parseResult = (0, import_modelfusion.safeParseJSON)({ text: event.data, schema });
      if (!parseResult.success) {
        onError(parseResult.error, eventSource);
        return;
      }
      onEvent(parseResult.value, eventSource);
    } catch (error) {
      onError(error, eventSource);
    }
  };
  eventSource.onerror = (e) => {
    onError(e, eventSource);
  };
}

// src/browser/invokeFlow.ts
async function invokeFlow({
  url,
  input,
  schema,
  onEvent,
  onStop
}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const eventSourceUrl = (await response.json()).url;
  readEventSource({
    url: eventSourceUrl,
    schema: (0, import_modelfusion2.zodSchema)(schema.events),
    isStopEvent(event) {
      return event.data === "[DONE]";
    },
    onEvent,
    onStop
  });
}

// src/browser/readEventSourceStream.ts
var import_modelfusion3 = require("modelfusion");
var import_internal = require("modelfusion/internal");
function readEventSourceStream({
  stream,
  schema,
  errorHandler
}) {
  const queue = new import_modelfusion3.AsyncQueue();
  (0, import_internal.parseEventSourceStream)({ stream }).then(async (events) => {
    try {
      for await (const event of events) {
        const validationResult = (0, import_modelfusion3.safeParseJSON)({ text: event.data, schema });
        if (!validationResult.success) {
          errorHandler?.(validationResult.error);
          continue;
        }
        queue.push(validationResult.value);
      }
    } catch (error) {
      errorHandler?.(error);
    } finally {
      queue.close();
    }
  }).catch((error) => {
    errorHandler?.(error);
    queue.close();
  });
  return queue;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MediaSourceAppender,
  convertAudioChunksToBase64,
  convertBlobToBase64,
  invokeFlow,
  readEventSource,
  readEventSourceStream
});
//# sourceMappingURL=index.cjs.map