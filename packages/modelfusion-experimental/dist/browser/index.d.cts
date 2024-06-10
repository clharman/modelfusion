import { z } from 'zod';
import { Schema } from 'modelfusion';
import { ErrorHandler } from 'modelfusion/internal';

declare class MediaSourceAppender {
    private readonly mediaSource;
    private readonly audioChunks;
    private sourceBuffer?;
    private getMediaSource;
    constructor(type: string);
    private tryAppendNextChunk;
    addBase64Data(base64Data: string): void;
    addData(data: ArrayBuffer): void;
    close(): void;
    get mediaSourceUrl(): string;
}

declare function convertAudioChunksToBase64({ audioChunks, mimeType, }: {
    audioChunks: Blob[];
    mimeType: string;
}): Promise<string>;

declare function convertBlobToBase64(blob: Blob): Promise<string>;

interface FlowSchema<INPUT, EVENT> {
    input: z.ZodType<INPUT>;
    events: z.ZodType<EVENT>;
}

declare function invokeFlow<INPUT, EVENT>({ url, input, schema, onEvent, onStop, }: {
    url: string;
    input: INPUT;
    schema: FlowSchema<INPUT, EVENT>;
    onEvent: (event: EVENT, eventSource: EventSource) => void;
    onStop?: (eventSource: EventSource) => void;
}): Promise<void>;

declare function readEventSource<T>({ url, schema, onEvent, onError, onStop, isStopEvent, }: {
    url: string;
    schema: Schema<T>;
    onEvent: (event: T, eventSource: EventSource) => void;
    onError?: (error: unknown, eventSource: EventSource) => void;
    onStop?: (eventSource: EventSource) => void;
    isStopEvent?: (event: MessageEvent<unknown>) => boolean;
}): void;

declare function readEventSourceStream<T>({ stream, schema, errorHandler, }: {
    stream: ReadableStream<Uint8Array>;
    schema: Schema<T>;
    errorHandler?: ErrorHandler;
}): AsyncIterable<T>;

export { MediaSourceAppender, convertAudioChunksToBase64, convertBlobToBase64, invokeFlow, readEventSource, readEventSourceStream };
