export class PineconeVectorIndex {
    constructor({ index, namespace, schema, }) {
        Object.defineProperty(this, "index", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.index = index;
        this.namespace = namespace;
        this.schema = schema;
    }
    async upsertMany(data) {
        this.index.upsert({
            upsertRequest: {
                namespace: this.namespace,
                vectors: data.map((entry) => ({
                    id: entry.id,
                    values: entry.vector,
                    metadata: entry.data,
                })),
            },
        });
    }
    async queryByVector({ queryVector, similarityThreshold, maxResults, }) {
        const { matches } = await this.index.query({
            queryRequest: {
                namespace: this.namespace,
                vector: queryVector,
                topK: maxResults,
                includeMetadata: true,
            },
        });
        if (matches == undefined) {
            return [];
        }
        return matches
            .filter((match) => similarityThreshold == undefined ||
            match.score == undefined ||
            match.score > similarityThreshold)
            .map((match) => {
            const validationResult = this.schema.validate(match.metadata);
            if (!validationResult.success) {
                throw validationResult.error;
            }
            return {
                id: match.id,
                data: validationResult.value,
                similarity: match.score,
            };
        });
    }
    asIndex() {
        return this;
    }
}
