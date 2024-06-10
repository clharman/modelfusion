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
import { zodSchema } from "modelfusion";

// src/browser/readEventSource.ts
import { safeParseJSON } from "modelfusion";
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
      const parseResult = safeParseJSON({ text: event.data, schema });
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
    schema: zodSchema(schema.events),
    isStopEvent(event) {
      return event.data === "[DONE]";
    },
    onEvent,
    onStop
  });
}

// src/browser/readEventSourceStream.ts
import { AsyncQueue, safeParseJSON as safeParseJSON2 } from "modelfusion";
import { parseEventSourceStream } from "modelfusion/internal";
function readEventSourceStream({
  stream,
  schema,
  errorHandler
}) {
  const queue = new AsyncQueue();
  parseEventSourceStream({ stream }).then(async (events) => {
    try {
      for await (const event of events) {
        const validationResult = safeParseJSON2({ text: event.data, schema });
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
export {
  MediaSourceAppender,
  convertAudioChunksToBase64,
  convertBlobToBase64,
  invokeFlow,
  readEventSource,
  readEventSourceStream
};
//# sourceMappingURL=index.js.map