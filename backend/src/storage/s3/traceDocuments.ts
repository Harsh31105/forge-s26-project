import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    type PutObjectCommandInput,
    type GetObjectCommandInput,
} from "@aws-sdk/client-s3";
import type { S3 as S3Config } from "../../config/s3";
import type { Readable } from "stream";

export interface TraceDocumentKey {
    departmentId: number;
    courseCode: number;
    semester: string;
    lectureYear: number;
    professorId: string;
}

export interface TraceDocumentRepository {
    uploadPdf(key: TraceDocumentKey, pdfBuffer: Buffer): Promise<string>;
    getPdf(key: TraceDocumentKey): Promise<Readable>;
    getPdfByFullKey(s3Key: string): Promise<Readable>;
}

/**
 * S3 key prefix structure:
 *   trace-evaluations/{departmentId}/{courseCode}/{semester}_{lectureYear}/{professorId}.pdf
 *
 * Example:
 *   trace-evaluations/3/1200/fall_2025/a1b2c3d4.pdf
 */
function buildS3Key(key: TraceDocumentKey): string {
    return [
        "trace-evaluations",
        String(key.departmentId),
        String(key.courseCode),
        `${key.semester}_${key.lectureYear}`,
        `${key.professorId}.pdf`,
    ].join("/");
}

export class TraceDocumentRepositoryS3 implements TraceDocumentRepository {
    private readonly client: S3Client;
    private readonly bucketName: string;

    constructor(config: S3Config) {
        this.client = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
        this.bucketName = config.bucketName;
    }

    async uploadPdf(key: TraceDocumentKey, pdfBuffer: Buffer): Promise<string> {
        const s3Key = buildS3Key(key);

        const params: PutObjectCommandInput = {
            Bucket: this.bucketName,
            Key: s3Key,
            Body: pdfBuffer,
            ContentType: "application/pdf",
        };

        try {
            await this.client.send(new PutObjectCommand(params));
            return s3Key;
        } catch (err: unknown) {
            throw mapS3Error(err, `Failed to upload PDF to s3://${this.bucketName}/${s3Key}`);
        }
    }

    async getPdf(key: TraceDocumentKey): Promise<Readable> {
        return this.getPdfByFullKey(buildS3Key(key));
    }

    async getPdfByFullKey(s3Key: string): Promise<Readable> {
        const params: GetObjectCommandInput = {
            Bucket: this.bucketName,
            Key: s3Key,
        };

        try {
            const response = await this.client.send(new GetObjectCommand(params));

            if (!response.Body) {
                throw new S3StorageError("S3 returned an empty response body", "EMPTY_RESPONSE");
            }

            return response.Body as Readable;
        } catch (err: unknown) {
            if (err instanceof S3StorageError) throw err;
            throw mapS3Error(err, `Failed to retrieve PDF from s3://${this.bucketName}/${s3Key}`);
        }
    }
}

export type S3ErrorCode =
    | "BUCKET_NOT_FOUND"
    | "OBJECT_NOT_FOUND"
    | "ACCESS_DENIED"
    | "INVALID_CREDENTIALS"
    | "NETWORK_ERROR"
    | "EMPTY_RESPONSE"
    | "UNKNOWN";

export class S3StorageError extends Error {
    public readonly code: S3ErrorCode;

    constructor(message: string, code: S3ErrorCode) {
        super(message);
        this.name = "S3StorageError";
        this.code = code;
        Object.setPrototypeOf(this, S3StorageError.prototype);
    }
}

function mapS3Error(err: unknown, context: string): S3StorageError {
    const name = (err as { name?: string })?.name ?? "";
    const message = (err as { message?: string })?.message ?? "";

    if (name === "NoSuchBucket") {
        return new S3StorageError(`${context}: bucket does not exist`, "BUCKET_NOT_FOUND");
    }
    if (name === "NoSuchKey" || name === "NotFound") {
        return new S3StorageError(`${context}: object not found`, "OBJECT_NOT_FOUND");
    }
    if (name === "AccessDenied" || name === "Forbidden") {
        return new S3StorageError(`${context}: access denied`, "ACCESS_DENIED");
    }
    if (name === "InvalidAccessKeyId" || name === "SignatureDoesNotMatch") {
        return new S3StorageError(`${context}: invalid AWS credentials`, "INVALID_CREDENTIALS");
    }
    if (
        name === "NetworkingError" ||
        message.includes("ECONNREFUSED") ||
        message.includes("ETIMEDOUT") ||
        message.includes("getaddrinfo")
    ) {
        return new S3StorageError(`${context}: network error`, "NETWORK_ERROR");
    }

    return new S3StorageError(`${context}: ${message || "unknown error"}`, "UNKNOWN");
}
