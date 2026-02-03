import { Express } from "express";
import { Repository } from "../storage/storage";
declare class App {
    server: Express;
    repo: Repository;
    constructor(repo: Repository);
    listen(port: string): void;
}
export declare function initApp(): App;
export {};
//# sourceMappingURL=server.d.ts.map