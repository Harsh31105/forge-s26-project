import { Router } from "express";
import multer from "multer";
import { StudentHandler } from "./index";

const upload = multer({ storage: multer.memoryStorage() });

export function studentRoutes(handler: StudentHandler): Router {
    const router = Router();

    router.get("/", handler.handleGet.bind(handler));

    router.get("/email/:email", handler.handleGetByEmail.bind(handler));

    router.get("/:id", handler.handleGetByID.bind(handler));
    router.post("/", handler.handlePost.bind(handler));
    router.patch("/:id", upload.single("profilePicture"), handler.handlePatch.bind(handler));
    router.delete("/:id", handler.handleDelete.bind(handler));

    router.post("/:id/majors", handler.handlePostMajor.bind(handler));
    router.delete("/:id/majors/:majorId", handler.handleDeleteMajor.bind(handler));

    router.post("/:id/concentrations", handler.handlePostConcentration.bind(handler));
    router.delete("/:id/concentrations/:concentrationId", handler.handleDeleteConcentration.bind(handler));

    router.post("/:id/minors", handler.handlePostMinor.bind(handler));
    router.delete("/:id/minors/:minorId", handler.handleDeleteMinor.bind(handler));

    return router;
}