import type { Request, Response, NextFunction } from "express";

export class HTTPError extends Error {
    public code: number;
    public message: any;

    constructor(code: number, message: any) {
        super(typeof message === 'string' ? message : JSON.stringify(message));
        this.code = code;
        this.message = message;
        Object.setPrototypeOf(this, HTTPError.prototype);
    }
}

export const BadRequest = (msg?: string) => {
    return new HTTPError(400, msg || "bad request");
}

export const Unauthorized = (msg?: string) => {
    return new HTTPError(401, msg || "unauthorized");
}

export const NotFound = (...msg: string[]) => {
    if (msg.length === 0) return new HTTPError(404, "resource not found");
    if (msg.length === 1) return new HTTPError(404, msg[0]);
    if (msg.length === 3) return new HTTPError(404, `${msg[0]} with ${msg[1]}='${msg[2]}' not found`);
    return new HTTPError(404, msg.join(", "));
};

export const Conflict = (...msg: string[]) => {
    if (msg.length === 0) return new HTTPError(409, "resource conflict");
    if (msg.length === 1) return new HTTPError(409, msg[0]);
    if (msg.length === 3) return new HTTPError(409, `${msg[0]} with ${msg[1]}='${msg[2]}' already exists`);
    return new HTTPError(409, msg.join(", "));
};

export const InvalidRequestData = (errors: Record<string, string>) => {
    return new HTTPError(400, errors);
}

export const InternalServerError = (msg?: string) => {
    return new HTTPError(500, msg || "internal server error");
}

export const Forbidden = (msg?: string) => {
    return new HTTPError(403, msg || "forbidden");
}

export const UnprocessableEntity = (msg?: string) => {
    return new HTTPError(422, msg || "unprocessable entity");
}

export const InvalidJSON = (msg?: string) => {
    new HTTPError(400, msg || "invalid json");
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let httperror: HTTPError;

    if (err instanceof HTTPError) {
        httperror = err;
    } else {
        httperror = InternalServerError();
        console.error("Unexpected Error: ", err);
    }

    return res.status(httperror.code).json({
        code: httperror.code,
        message: httperror.message,
    })
}

// Internal DB Error Management.
export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Not Found Error";
    }
}

// DB Error Handling.
function getErrorMessage(err :unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
        return JSON.stringify(err);
    } catch {
        return "unknown error";
    }
}

export function mapDBError(err: unknown, str: string): never {
    const message = getErrorMessage(err).toLowerCase();

    if (message.includes("foreign key")) {
        throw BadRequest("invalid reference");
    } else if (message.includes("check constraint")) {
        throw BadRequest("violated a check constraint");
    } else if (message.includes("duplicate key") || message.includes("unique constraint")) {
        throw Conflict("duplicate value");
    } else if (message.includes("connection refused")) {
        throw InternalServerError("database connection refused");
    } else {
        throw InternalServerError(str);
    }
}
