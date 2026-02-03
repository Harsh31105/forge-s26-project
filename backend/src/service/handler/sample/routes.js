"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleRoutes = sampleRoutes;
const express_1 = require("express");
function sampleRoutes(handler) {
    const router = (0, express_1.Router)();
    router.get("/", handler.handleGet.bind(handler));
    router.get("/:id", handler.handleGetByID.bind(handler));
    router.post("/", handler.handlePost.bind(handler));
    router.patch("/:id", handler.handlePatch.bind(handler));
    router.delete("/:id", handler.handleDelete.bind(handler));
    return router;
}
//# sourceMappingURL=routes.js.map