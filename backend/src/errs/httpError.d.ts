import type { Request, Response, NextFunction } from "express";
export declare class HTTPError extends Error {
    code: number;
    message: any;
    constructor(code: number, message: any);
}
export declare const BadRequest: (msg?: string) => HTTPError;
export declare const Unauthorized: (msg?: string) => HTTPError;
export declare const NotFound: (...msg: string[]) => HTTPError;
export declare const Conflict: (...msg: string[]) => HTTPError;
export declare const InvalidRequestData: (errors: Record<string, string>) => HTTPError;
export declare const InternalServerError: (msg?: string) => HTTPError;
export declare const Forbidden: (msg?: string) => HTTPError;
export declare const UnprocessableEntity: (msg?: string) => HTTPError;
export declare const InvalidJSON: (msg?: string) => void;
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare class NotFoundError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=httpError.d.ts.map