"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamplePatchInputSchema = exports.SamplePostInputSchema = void 0;
const zod_1 = require("zod");
exports.SamplePostInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name cannot be empty")
        .refine((s) => s === s.trim(), "Name cannot have leading/trailing spaces"),
});
exports.SamplePatchInputSchema = exports.SamplePostInputSchema.partial();
//# sourceMappingURL=sample.js.map