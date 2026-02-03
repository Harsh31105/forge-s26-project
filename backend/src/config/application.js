"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationConfig = void 0;
const process_1 = __importDefault(require("process"));
exports.applicationConfig = {
    port: process_1.default.env.PORT || '8080',
    environment: process_1.default.env.ENVIRONMENT || 'development',
    allowedOrigins: process_1.default.env.ALLOWED_ORIGINS || 'http://localhost:3000',
};
//# sourceMappingURL=application.js.map