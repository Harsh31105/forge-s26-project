import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    type PutObjectCommandInput,
    type GetObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { S3 as S3Config } from "../../config/s3";
import { S3StorageError, mapS3Error } from "./traceDocuments";

const PRESIGNED_URL_EXPIRES_IN = 60 * 60; // 1 hour

export interface ProfilePictureRepository {
    upload(studentId: string, buffer: Buffer, mimeType: string): Promise<string>;
    getPresignedUrl(key: string): Promise<string>;
}

function buildS3Key(studentId: string, mimeType: string): string {
    const ext = mimeType === "image/png" ? "png" : "jpg";
    return `profile-pictures/${studentId}.${ext}`;
}

export class ProfilePictureRepositoryS3 implements ProfilePictureRepository {
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

    async upload(studentId: string, buffer: Buffer, mimeType: string): Promise<string> {
        const s3Key = buildS3Key(studentId, mimeType);

        const params: PutObjectCommandInput = {
            Bucket: this.bucketName,
            Key: s3Key,
            Body: buffer,
            ContentType: mimeType,
        };

        try {
            await this.client.send(new PutObjectCommand(params));
            return s3Key;
        } catch (err: unknown) {
            throw mapS3Error(err, `Failed to upload profile picture to s3://${this.bucketName}/${s3Key}`);
        }
    }

    async getPresignedUrl(key: string): Promise<string> {
        const params: GetObjectCommandInput = {
            Bucket: this.bucketName,
            Key: key,
        };

        try {
            return await getSignedUrl(
                this.client,
                new GetObjectCommand(params),
                { expiresIn: PRESIGNED_URL_EXPIRES_IN },
            );
        } catch (err: unknown) {
            throw mapS3Error(err, `Failed to generate presigned URL for s3://${this.bucketName}/${key}`);
        }
    }
}