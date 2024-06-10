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

// src/server/fastify/index.ts
var fastify_exports = {};
__export(fastify_exports, {
  DefaultFlow: () => DefaultFlow,
  FileSystemAssetStorage: () => FileSystemAssetStorage,
  FileSystemLogger: () => FileSystemLogger,
  FlowRun: () => FlowRun,
  modelFusionFastifyPlugin: () => modelFusionFastifyPlugin
});
module.exports = __toCommonJS(fastify_exports);

// src/server/fastify/DefaultFlow.ts
var DefaultFlow = class {
  schema;
  constructor({
    schema,
    process
  }) {
    this.schema = schema;
    this.process = process;
  }
  process;
};

// src/server/fastify/FileSystemAssetStorage.ts
var import_node_fs = require("fs");
var import_node_path = require("path");
var FileSystemAssetStorage = class {
  path;
  logger;
  constructor({
    path,
    logger
  }) {
    this.path = path;
    this.logger = logger;
  }
  async storeAsset({
    run,
    asset
  }) {
    try {
      const assetPath = this.path(run);
      await import_node_fs.promises.mkdir(assetPath, { recursive: true });
      await import_node_fs.promises.writeFile((0, import_node_path.join)(assetPath, asset.name), asset.data);
      await import_node_fs.promises.writeFile(
        (0, import_node_path.join)(assetPath, `${asset.name}.meta.json`),
        JSON.stringify({
          name: asset.name,
          contentType: asset.contentType
        })
      );
    } catch (error) {
      this.logger.logError({
        run,
        message: `Failed to store asset ${asset.name}`,
        error
      });
      throw error;
    }
  }
  async readAsset(options) {
    try {
      const assetPath = this.path(options.run);
      const data = await import_node_fs.promises.readFile((0, import_node_path.join)(assetPath, options.assetName));
      const meta = await import_node_fs.promises.readFile(
        (0, import_node_path.join)(assetPath, `${options.assetName}.meta.json`)
      );
      const { name, contentType } = JSON.parse(meta.toString());
      return { data, name, contentType };
    } catch (error) {
      this.logger.logError({
        run: options.run,
        message: `Failed to read asset ${options.assetName}`,
        error
      });
      throw error;
    }
  }
};

// src/server/fastify/FileSystemLogger.ts
var import_node_fs2 = require("fs");
var import_node_path2 = require("path");
var FileSystemLogger = class {
  logPath;
  constructor({ path }) {
    this.logPath = path;
  }
  async logFunctionEvent({
    run,
    event
  }) {
    const timestamp = event.startTimestamp.getTime();
    try {
      const logPath = this.logPath(run);
      await import_node_fs2.promises.mkdir(logPath, { recursive: true });
      await import_node_fs2.promises.writeFile(
        (0, import_node_path2.join)(
          logPath,
          `${timestamp}-${event.callId}-${event.functionId ?? event.functionType}-${event.eventType}.json`
        ),
        JSON.stringify(event)
      );
    } catch (error) {
      this.logError({
        run,
        message: `Failed to write function event ${event.callId}`,
        error
      });
    }
  }
  async logError({
    run,
    error,
    message
  }) {
    const timestamp = Date.now();
    try {
      const logPath = this.logPath(run);
      await import_node_fs2.promises.mkdir(logPath, { recursive: true });
      await import_node_fs2.promises.writeFile(
        (0, import_node_path2.join)(logPath, `${timestamp}-error.json`),
        JSON.stringify({
          timestamp: new Date(timestamp).toISOString(),
          runId: run.runId,
          message,
          error
        })
      );
    } catch (error2) {
      console.error(`Failed to write error log`);
      console.error(error2);
    }
  }
};

// src/server/fastify/FlowRun.ts
var import_modelfusion = require("modelfusion");
var FlowRun = class extends import_modelfusion.DefaultRun {
  eventQueue = new import_modelfusion.AsyncQueue();
  assetStorage;
  logger;
  paths;
  constructor({
    paths,
    assetStorage,
    logger
  }) {
    super();
    this.paths = paths;
    this.assetStorage = assetStorage;
    this.logger = logger;
  }
  functionObserver = {
    onFunctionEvent: async (event) => {
      this.logger.logFunctionEvent({
        run: this,
        event
      });
    }
  };
  publishEvent(event) {
    this.eventQueue.push(event);
  }
  async storeBinaryAsset(asset) {
    await this.assetStorage.storeAsset({
      run: this,
      asset
    });
    return this.paths.getAssetUrl(this.runId, asset.name);
  }
  async storeTextAsset(asset) {
    return this.storeBinaryAsset({
      data: Buffer.from(asset.text),
      contentType: asset.contentType,
      name: asset.name
    });
  }
  finish() {
    this.eventQueue.close();
  }
};

// src/server/fastify/PathProvider.ts
var PathProvider = class {
  baseUrl;
  basePath;
  constructor({ baseUrl, basePath }) {
    this.baseUrl = baseUrl;
    this.basePath = basePath;
  }
  getAssetUrl(runId, assetName) {
    return `${this.baseUrl}${this.basePath}/${runId}/assets/${assetName}`;
  }
  getAssetPathTemplate() {
    return `${this.basePath}/:runId/assets/:assetName`;
  }
  getEventsUrl(runId) {
    return `${this.baseUrl}${this.basePath}/${runId}/events`;
  }
  getEventsPathTemplate() {
    return `${this.basePath}/:runId/events`;
  }
};

// src/server/fastify/modelFusionFlowPlugin.ts
var import_modelfusion2 = require("modelfusion");
var modelFusionFastifyPlugin = async (fastify, {
  flow,
  baseUrl,
  basePath,
  assetStorage,
  logger
}) => {
  const paths = new PathProvider({
    baseUrl,
    basePath
  });
  const runs = {};
  fastify.post(paths.basePath, async (request) => {
    const run = new FlowRun({
      paths,
      assetStorage,
      logger
    });
    runs[run.runId] = run;
    const input = flow.schema.input.parse(request.body);
    (0, import_modelfusion2.withRun)(run, async () => {
      flow.process({
        input,
        run
      }).catch((error) => {
        console.error("Failed to process flow", error);
        logger.logError({
          run,
          message: "Failed to process flow",
          error
        });
      }).finally(async () => {
        run.finish();
      });
    });
    return {
      id: run.runId,
      url: paths.getEventsUrl(run.runId)
    };
  });
  fastify.get(paths.getAssetPathTemplate(), async (request, reply) => {
    const runId = request.params.runId;
    const assetName = request.params.assetName;
    const asset = await assetStorage.readAsset({
      run: runs[runId],
      assetName
    });
    if (asset == null) {
      logger.logError({
        run: runs[runId],
        message: `Asset ${assetName} not found`,
        error: new Error(`Asset ${assetName} not found`)
      });
      reply.status(404);
      return { error: `Asset ${assetName} not found` };
    }
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Length": asset.data.length,
      "Content-Type": asset.contentType,
      "Cache-Control": "no-cache"
    };
    reply.raw.writeHead(200, headers);
    reply.raw.write(asset.data);
    reply.raw.end();
    return;
  });
  fastify.get(paths.getEventsPathTemplate(), async (request, reply) => {
    const runId = request.params.runId;
    const eventQueue = runs[runId]?.eventQueue;
    if (!eventQueue) {
      return {
        error: `No event queue found for run ID ${runId}`
      };
    }
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      "Content-Encoding": "none"
    };
    reply.raw.writeHead(200, headers);
    const textEncoder = new TextEncoder();
    for await (const event of eventQueue) {
      if (reply.raw.destroyed) {
        break;
      }
      reply.raw.write(textEncoder.encode(`data: ${JSON.stringify(event)}

`));
    }
    if (!reply.raw.destroyed) {
      reply.raw.write(textEncoder.encode(`data: [DONE]

`));
    }
    reply.raw.end();
    return;
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DefaultFlow,
  FileSystemAssetStorage,
  FileSystemLogger,
  FlowRun,
  modelFusionFastifyPlugin
});
//# sourceMappingURL=index.cjs.map