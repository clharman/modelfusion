import { VectorOperationsApi } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/index.js";
import { Schema, Vector, VectorIndex } from "modelfusion";
export declare class PineconeVectorIndex<DATA extends object | undefined> implements VectorIndex<DATA, PineconeVectorIndex<DATA>, null> {
    readonly index: VectorOperationsApi;
    readonly namespace?: string;
    readonly schema: Schema<DATA>;
    constructor({ index, namespace, schema, }: {
        index: VectorOperationsApi;
        namespace?: string;
        schema: Schema<DATA>;
    });
    upsertMany(data: Array<{
        id: string;
        vector: Vector;
        data: DATA;
    }>): Promise<void>;
    queryByVector({ queryVector, similarityThreshold, maxResults, }: {
        queryVector: Vector;
        maxResults: number;
        similarityThreshold?: number;
    }): Promise<Array<{
        id: string;
        data: DATA;
        similarity?: number;
    }>>;
    asIndex(): PineconeVectorIndex<DATA>;
}
