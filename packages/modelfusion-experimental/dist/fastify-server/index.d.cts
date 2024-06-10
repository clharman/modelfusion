import { FunctionEvent, DefaultRun, AsyncQueue } from 'modelfusion';
import { z } from 'zod';
import { FastifyPluginAsync } from 'fastify';

interface Logger {
    logFunctionEvent(options: {
        run: FlowRun<unknown>;
        event: FunctionEvent;
    }): Promise<void>;
    logError(options: {
        run: FlowRun<unknown>;
        message: string;
        error: unknown;
    }): Promise<void>;
}

declare class PathProvider {
    readonly baseUrl: string;
    readonly basePath: string;
    constructor({ baseUrl, basePath }: {
        baseUrl: string;
        basePath: string;
    });
    getAssetUrl(runId: string, assetName: string): string;
    getAssetPathTemplate(): string;
    getEventsUrl(runId: string): string;
    getEventsPathTemplate(): string;
}

declare class FlowRun<EVENT> extends DefaultRun {
    readonly eventQueue: AsyncQueue<EVENT>;
    private readonly assetStorage;
    private readonly logger;
    private readonly paths;
    constructor({ paths, assetStorage, logger, }: {
        paths: PathProvider;
        assetStorage: AssetStorage;
        logger: Logger;
    });
    readonly functionObserver: {
        onFunctionEvent: (event: FunctionEvent) => Promise<void>;
    };
    publishEvent(event: EVENT): void;
    storeBinaryAsset(asset: Asset): Promise<string>;
    storeTextAsset(asset: {
        text: string;
        contentType: string;
        name: string;
    }): Promise<string>;
    finish(): void;
}

type Asset = {
    data: Buffer;
    contentType: string;
    name: string;
};
interface AssetStorage {
    storeAsset(options: {
        run: FlowRun<unknown>;
        asset: Asset;
    }): Promise<void>;
    readAsset(options: {
        run: FlowRun<unknown>;
        assetName: string;
    }): Promise<Asset | null>;
}

interface FlowSchema<INPUT, EVENT> {
    input: z.ZodType<INPUT>;
    events: z.ZodType<EVENT>;
}

declare class DefaultFlow<INPUT, EVENT> {
    readonly schema: FlowSchema<INPUT, EVENT>;
    constructor({ schema, process, }: {
        schema: FlowSchema<INPUT, EVENT>;
        process: (options: {
            input: INPUT;
            run: FlowRun<EVENT>;
        }) => Promise<void>;
    });
    process: (options: {
        input: INPUT;
        run: FlowRun<EVENT>;
    }) => Promise<void>;
}

declare class FileSystemAssetStorage implements AssetStorage {
    private readonly path;
    private readonly logger;
    constructor({ path, logger, }: {
        path: (run: FlowRun<unknown>) => string;
        logger: Logger;
    });
    storeAsset({ run, asset, }: {
        run: FlowRun<unknown>;
        asset: Asset;
    }): Promise<void>;
    readAsset(options: {
        run: FlowRun<unknown>;
        assetName: string;
    }): Promise<Asset | null>;
}

declare class FileSystemLogger implements Logger {
    private readonly logPath;
    constructor({ path }: {
        path: (run: FlowRun<unknown>) => string;
    });
    logFunctionEvent({ run, event, }: {
        run: FlowRun<unknown>;
        event: FunctionEvent;
    }): Promise<void>;
    logError({ run, error, message, }: {
        run: FlowRun<unknown>;
        message: string;
        error: unknown;
    }): Promise<void>;
}

interface Flow<INPUT, EVENT> {
    readonly schema: FlowSchema<INPUT, EVENT>;
    process: (options: {
        input: INPUT;
        run: FlowRun<EVENT>;
    }) => Promise<void>;
}

interface ModelFusionFastifyPluginOptions {
    flow: Flow<any, any>;
    baseUrl: string;
    basePath: string;
    assetStorage: AssetStorage;
    logger: Logger;
}
declare const modelFusionFastifyPlugin: FastifyPluginAsync<ModelFusionFastifyPluginOptions>;

export { type Asset, type AssetStorage, DefaultFlow, FileSystemAssetStorage, FileSystemLogger, type Flow, FlowRun, type Logger, type ModelFusionFastifyPluginOptions, modelFusionFastifyPlugin };
