"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteVectorIndex = exports.setupSQLiteDatabase = void 0;
const sqliteVss = __importStar(require("sqlite-vss"));
function setupSQLiteDatabase(database) {
    sqliteVss.load(database);
    [
        `CREATE TABLE IF NOT EXISTS vectors (id TEXT PRIMARY KEY, data TEXT, vector TEXT)`,
        `CREATE VIRTUAL TABLE IF NOT EXISTS vss_vectors USING vss0(vector(1536))`,
    ].forEach((query) => database.prepare(query).run());
    return database;
}
exports.setupSQLiteDatabase = setupSQLiteDatabase;
class SQLiteVectorIndex {
    constructor({ db, schema, }) {
        Object.defineProperty(this, "db", {
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
        this.db = db;
        this.schema = schema;
    }
    async upsertMany(data) {
        const upsertData = this.db.transaction((items) => {
            const insertData = this.db.prepare("INSERT OR REPLACE INTO vectors (id, data, vector) VALUES (?, ?, ?)");
            const insertVss = this.db.prepare("INSERT OR REPLACE INTO vss_vectors (rowid, vector) VALUES (?, ?)");
            for (const item of items) {
                const dataString = JSON.stringify(item.data);
                const vectorString = JSON.stringify(item.vector);
                const result = insertData.run(item.id, dataString, vectorString);
                insertVss.run(result.lastInsertRowid, vectorString);
            }
        });
        upsertData(data);
    }
    async queryByVector({ queryVector, similarityThreshold, maxResults, }) {
        const maxDistance = similarityThreshold
            ? 1 - similarityThreshold
            : undefined;
        const query = `WITH matches AS (
            SELECT rowid, distance FROM vss_vectors WHERE vss_search(vector, ?) ${maxDistance !== undefined ? `AND distance <= ${maxDistance}` : ""} ${maxResults ? `LIMIT ${maxResults}` : ""}
        ) SELECT vectors.id, vectors.data, matches.distance FROM matches LEFT JOIN vectors ON vectors.rowid = matches.rowid`;
        const statement = this.db.prepare(query);
        const result = statement.all(JSON.stringify(queryVector));
        return result.map((row) => {
            const data = JSON.parse(row.data);
            const validationResult = this.schema.validate(data);
            if (!validationResult.success) {
                throw validationResult.error;
            }
            return {
                id: row.id,
                data: validationResult.value,
                similarity: 1 - row.distance,
            };
        });
    }
    asIndex() {
        return this;
    }
}
exports.SQLiteVectorIndex = SQLiteVectorIndex;
