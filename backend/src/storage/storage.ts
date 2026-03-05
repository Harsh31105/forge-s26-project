import { Pool } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {Sample, SamplePatchInputType, SamplePostInputType} from "../models/sample";
import {SampleRepositorySchema} from "./postgres/schema/samples";

import type {Favorite,
    FavoritePostInputType, 
    FavoritesListQueryType,
    FavoritesListResponse} from "../models/favorite";

import { FavoritesRepositorySchema} from "./postgres/schema/favorites";



export class Repository {
    public readonly samples: SampleRepository;
    public readonly favorites: FavoriteRepository;

    private readonly pool: Pool;
    private readonly db: NodePgDatabase;

    constructor(pool: Pool, db: NodePgDatabase) {
        this.pool = pool;
        this.db = db;
        
        this.favorites = new FavoritesRepositorySchema(db);
        this.samples = new SampleRepositorySchema(db);
    }

    async getDB(): Promise<NodePgDatabase> {
        return this.db;
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

export interface SampleRepository {
    getSamples(): Promise<Sample[]>;
    getSampleByID(id: string): Promise<Sample>;
    createSample(input: SamplePostInputType): Promise<Sample>;
    patchSample(id: string, input: SamplePatchInputType): Promise<Sample>;
    deleteSample(id: string): Promise<void>;
}


export interface FavoriteRepository {
    getFavorites(query: FavoritesListQueryType): Promise<FavoritesListResponse>;
    createFavorite(input: FavoritePostInputType): Promise<Favorite>;
    deleteFavorite(id: string): Promise<void>;
}