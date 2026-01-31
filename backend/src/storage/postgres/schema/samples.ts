import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {Sample} from "../../../models/sample";
import {SampleRepository} from "../../storage";

export class SampleRepositorySchema implements SampleRepository {
    constructor(private readonly db: NodePgDatabase) {}

    // TODO: Stubs.
    async getSamples(): Promise<Sample[]> {
        return []
    }
}