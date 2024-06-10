import BetterSqlite3 from "better-sqlite3";
import { Schema, Vector, VectorIndex } from "modelfusion";
export declare function setupSQLiteDatabase(database: BetterSqlite3.Database): BetterSqlite3.Database;
export declare class SQLiteVectorIndex<DATA extends object | undefined> implements VectorIndex<DATA, SQLiteVectorIndex<DATA>, null> {
    readonly db: BetterSqlite3.Database;
    readonly schema: Schema<DATA>;
    constructor({ db, schema, }: {
        db: BetterSqlite3.Database;
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
    asIndex(): SQLiteVectorIndex<DATA>;
}
