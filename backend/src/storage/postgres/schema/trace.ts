import {TraceRepository} from "../../storage";
import {NodePgDatabase} from "drizzle-orm/node-postgres";
import {getOffset, PaginationType} from "../../../utils/pagination";
import {Trace} from "../../../models/trace";
import {trace} from "../../tables/trace";


export class TraceRepositorySchema implements TraceRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getTraces(pagination: PaginationType): Promise<Trace[]> {
        return this.db.select().from(trace).limit(pagination.limit).offset(getOffset(pagination));
    }
}