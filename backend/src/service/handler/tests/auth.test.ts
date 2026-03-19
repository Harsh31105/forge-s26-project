import express, { type Express } from "express";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import request from "supertest";
import { googleClient, getAuthUrl } from "../../../auth/authClient";
import { AuthHandler } from "../auth";
import { errorHandler } from "../../../errs/httpError";
import { DB } from "config/db";
import { AnyARecord } from "node:dns";
// Uncomment the line below
// import { StudentRepo } from "../../../storage/storage";

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
    }
}

// Delete this function
function mockDb(options: { duplicateError?: boolean } = {} ) {
    const db: any = { 
        insert: jest.fn().mockReturnThis(),
        values: jest.fn(),
    };

    if (options.duplicateError) {
        const err = new Error("duplicate key value violates unique constraint");
        (err as any).cause = "duplicate key value violates unique constraint";
        db.values.mockRejectedValue(err);
    } else {
        db.values.mockResolvedValue([{ id: "new-123" }]);
    }

    return db;
}

describe("Auth Endpoints", () => {
    let app: Express;
    let db: jest.Mocked<DB>;
    // Uncomment line below
   // let repo: jest.Mocked<StudentRepository>;
    let handler: AuthHandler;

    beforeEach(() => {

        db = mockDb();
        handler = new AuthHandler(db as any);

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
        });
    });

    describe("GET /auth/callback", () => {
        test("sign up successful creating new student", async () => {
            mockGetToken.mockResolvedValue({
                tokens: { id_token: "mock-id-token"}
            });
            mockVerifyIdToken.mockResolvedValue(mockPayload("student@husky.neu.edu"));

            // Uncomment linse below
            // repo.createStudent.mockResolvedValue({
            //     id: "id67",
            //     firstName: "Tim",
            //     lastName: "Pineda",
            //     email: "student@husky.neu.edu",
            // });

            const res = await request(app).get("/auth/callback?code=mock-code");
            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Signup successful");
        });

        test("login successful", async () => {
            mockGetToken.mockResolvedValue({
                tokens: { id_token: "mock-id-token"}
            });
            mockVerifyIdToken.mockResolvedValue(mockPayload("existing@husky.neu.edu"));

            // Delete lines 118-123
            db = mockDb({ duplicateError: true }) as any;
            handler = new AuthHandler(db as any);
            app = express();
            app.use(express.json());
            app.get("/auth/callback", handler.handleCallback.bind(handler));
            app.use(errorHandler);

            // Uncomment the lines below
            // const err = new Error("duplicate key value violates unique constraint");
            // (err as any).cause = "duplicate key value violates unique constraint";
            // repo.createStudent.mockRejectedValue(err)

            const res = await request(app).get("/auth/callback?code=mock-code");
            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Login successful");
        });

        test("rejects non-Northeastern email", async () => {
            mockGetToken.mockResolvedValue({
                tokens: { id_token: "mock-id-token" },
            });
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
            mockGetToken.mockResolvedValue({
                tokens: { id_token: "mock-id-token" },
            });
            mockVerifyIdToken.mockResolvedValue({
                getPayload: () => ({
                    given_name: "Tim",
                    family_name: "Pineda",
                }),
            })

            const res = await request(app).get("/auth/callback?code=mock-code");
            expect (res.status).toBe(400);
            expect(res.body.error).toBe("Failed to get user information");

        });
    });
});
