import type { SampleRepository } from "../../../storage/storage";
import { Request, Response } from "express";
export declare class SampleHandler {
    private readonly repo;
    constructor(repo: SampleRepository);
    handleGet(req: Request, res: Response): Promise<void>;
    handleGetByID(req: Request, res: Response): Promise<void>;
    handlePost(req: Request, res: Response): Promise<void>;
    handlePatch(req: Request, res: Response): Promise<void>;
    handleDelete(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map