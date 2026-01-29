import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { sample } from "./tables/sample";
import type {Sample} from "../../../models/sample";
import {SampleRepository} from "../../storage";

export class SampleRepositorySchema implements SampleRepository {
    constructor(private readonly db: NodePgDatabase) {}

    // TODO: Stubs.
    async getSample(): Promise<Sample[]> {
        return []
    }
}