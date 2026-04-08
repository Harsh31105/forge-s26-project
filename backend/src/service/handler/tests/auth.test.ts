import express, { type Express } from "express";
import request from "supertest";
import { googleClient } from "../../../auth/authClient";
import { AuthHandler } from "../auth";
import { errorHandler } from "../../../errs/httpError";
import type { StudentRepository } from "../../../storage/storage";
import { Student } from "../../../models/student";

jest.mock("../../../auth/authClient", () => ({
    googleClient: {
        getToken: jest.fn(),
        verifyIdToken: jest.fn(),
        setCredentials: jest.fn(),
    },
    getAuthUrl: jest.fn().mockReturnValue("https://accounts.google.com/o/oauth2/v2/auth?mock=true"),
}));

jest.mock("jsonwebtoken", () => ({
    sign: jest.fn().mockReturnValue("mock-jwt-token"),
}));

const mockGetToken = googleClient.getToken as jest.Mock;
const mockVerifyIdToken = googleClient.verifyIdToken as jest.Mock;

function mockPayload(email: string, givenName: string = "Tim", familyName: string = "Pineda") {
    return {
        getPayload: () => ({
            email,
            given_name: givenName,
            family_name: familyName,
            name: `${givenName} ${familyName}`,
        })
    };
}

describe("Auth Endpoints", () => {
    let app: Express;
    let repo: jest.Mocked<StudentRepository>;
    let handler: AuthHandler;

    beforeEach(() => {
        repo = {
            createStudent: jest.fn(),
            getStudentByEmail: jest.fn(),
        } as unknown as jest.Mocked<StudentRepository>;

        handler = new AuthHandler(repo);

        app = express();
        app.use(express.json());
        app.get("/auth/signin", handler.handleRedirect.bind(handler));
        app.get("/auth/callback", handler.handleCallback.bind(handler));
        app.use(errorHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /auth/signin", () => {
        test("redirects to Google OAuth", async () => {
            const res = await request(app).get("/auth/signin");
            expect(res.status).toBe(302);
            expect(res.headers.location).toContain("accounts.google.com");
        });
    });

    describe("GET /auth/callback", () => {
        test("sign up successful creating new student", async () => {
            mockGetToken.mockResolvedValue({ tokens: { id_token: "mock-id-token" } });
            mockVerifyIdToken.mockResolvedValue(mockPayload("student@husky.neu.edu"));

            repo.createStudent.mockResolvedValue({
                id: "id67",
                firstName: "Tim",
                lastName: "Pineda",
                email: "student@husky.neu.edu",
            } as Student);

            const res = await request(app).get("/auth/callback?code=mock-code");
            expect(res.status).toBe(302);
            expect(res.headers.location).toContain("/onboarding?token=");
        });

        test("login successful when student already exists", async () => {
            mockGetToken.mockResolvedValue({ tokens: { id_token: "mock-id-token" } });
            mockVerifyIdToken.mockResolvedValue(mockPayload("existing@husky.neu.edu"));

            // Simulate duplicate creation → login path
            const duplicateError = new Error("duplicate key value violates unique constraint");
            (duplicateError as any).cause = "duplicate key value violates unique constraint";

            repo.createStudent.mockRejectedValue(duplicateError);
            repo.getStudentByEmail.mockResolvedValue({
                id: "idExisting",
                firstName: "Existing",
                lastName: "User",
                email: "existing@husky.neu.edu",
            } as Student);

            const res = await request(app).get("/auth/callback?code=mock-code");
            expect(res.status).toBe(302);
            expect(res.headers.location).toContain("/?token=");
        });

        test("rejects non-Northeastern email", async () => {
            mockGetToken.mockResolvedValue({ tokens: { id_token: "mock-id-token" } });
            mockVerifyIdToken.mockResolvedValue(mockPayload("user@gmail.com"));

            const res = await request(app).get("/auth/callback?code=mock-code");
            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Only Northeastern email addresses are allowed");
        });

        test("missing authorization code", async () => {
            const res = await request(app).get("/auth/callback");
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Missing authorization code");
        });

        test("payload has no email", async () => {
            mockGetToken.mockResolvedValue({ tokens: { id_token: "mock-id-token" } });
            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => ({ given_name: "Tim", family_name: "Pineda" }),
            });

            const res = await request(app).get("/auth/callback?code=mock-code");
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Failed to get user information");
        });
    });
});