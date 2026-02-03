"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = exports.errorHandler = exports.InvalidJSON = exports.UnprocessableEntity = exports.Forbidden = exports.InternalServerError = exports.InvalidRequestData = exports.Conflict = exports.NotFound = exports.Unauthorized = exports.BadRequest = exports.HTTPError = void 0;
class HTTPError extends Error {
    code;
    message;
    constructor(code, message) {
        super(typeof message === 'string' ? message : JSON.stringify(message));
        this.code = code;
        this.message = message;
        Object.setPrototypeOf(this, HTTPError.prototype);
    }
}
exports.HTTPError = HTTPError;
const BadRequest = (msg) => {
    return new HTTPError(400, msg || "bad request");
};
exports.BadRequest = BadRequest;
const Unauthorized = (msg) => {
    return new HTTPError(401, msg || "unauthorized");
};
exports.Unauthorized = Unauthorized;
const NotFound = (...msg) => {
    if (msg.length === 0)
        return new HTTPError(404, "resource not found");
    if (msg.length === 1)
        return new HTTPError(404, msg[0]);
    if (msg.length === 3)
        return new HTTPError(404, `${msg[0]} with ${msg[1]}='${msg[2]}' not found`);
    return new HTTPError(404, msg.join(", "));
};
exports.NotFound = NotFound;
const Conflict = (...msg) => {
    if (msg.length === 0)
        return new HTTPError(409, "resource conflict");
    if (msg.length === 1)
        return new HTTPError(409, msg[0]);
    if (msg.length === 3)
        return new HTTPError(409, `${msg[0]} with ${msg[1]}='${msg[2]}' already exists`);
    return new HTTPError(409, msg.join(", "));
};
exports.Conflict = Conflict;
const InvalidRequestData = (errors) => {
    return new HTTPError(400, errors);
};
exports.InvalidRequestData = InvalidRequestData;
const InternalServerError = (msg) => {
    return new HTTPError(500, msg || "internal server error");
};
exports.InternalServerError = InternalServerError;
const Forbidden = (msg) => {
    return new HTTPError(403, msg || "forbidden");
};
exports.Forbidden = Forbidden;
const UnprocessableEntity = (msg) => {
    return new HTTPError(422, msg || "unprocessable entity");
};
exports.UnprocessableEntity = UnprocessableEntity;
const InvalidJSON = (msg) => {
    new HTTPError(400, msg || "invalid json");
};
exports.InvalidJSON = InvalidJSON;
const errorHandler = (err, req, res, next) => {
    let httperror;
    if (err instanceof HTTPError) {
        httperror = err;
    }
    else {
        httperror = (0, exports.InternalServerError)();
        console.error("Unexpected Error: ", err);
    }
    return res.status(httperror.code).json({
        code: httperror.code,
        message: httperror.message,
    });
};
exports.errorHandler = errorHandler;
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "Not Found Error";
    }
}
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=httpError.js.map