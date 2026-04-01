import { UserPayload } from "../auth/middleware";

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}

export {};