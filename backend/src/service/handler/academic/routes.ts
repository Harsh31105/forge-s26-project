import { Router } from "express";
import { AcademicHandler } from "./index";

export function academicRoutes(handler: AcademicHandler): Router {
    const router = Router();

    router.get("/majors", handler.handleGetMajors.bind(handler));
    router.get("/concentrations", handler.handleGetConcentrations.bind(handler));
    router.get("/minors", handler.handleGetMinors.bind(handler));

    return router;
}
