import { Express } from "express";
import { Repository } from "../storage/storage";

export class App {
    public server: Express;
    public repo: Repository;

    constructor(repo: Repository) {
        this.server = initApp(repo);
    }
}