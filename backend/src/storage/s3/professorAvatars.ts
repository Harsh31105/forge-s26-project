import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { S3 as S3Config } from "../../config/s3";

const AVATAR_KEYS = [
    "professor-avatars/1.jpeg",
    "professor-avatars/2.webp",
    "professor-avatars/3.jpeg",
    "professor-avatars/4.webp",
    "professor-avatars/5.jpeg",
    "professor-avatars/6.jpeg",
    "professor-avatars/7.jpg",
    "professor-avatars/8.webp",
    "professor-avatars/9.jpeg",
    "professor-avatars/10.png",
];

export interface ProfessorAvatarRepository {
    getRandomAvatarKey(): string;
    getPresignedUrl(key: string): Promise<string>;
}

export class ProfessorAvatarRepositoryS3 implements ProfessorAvatarRepository {
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

    getRandomAvatarKey(): string {
        return AVATAR_KEYS[Math.floor(Math.random() * AVATAR_KEYS.length)]!;
    }

    async getPresignedUrl(key: string): Promise<string> {
        try {
            const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
            return await getSignedUrl(this.client, command, { expiresIn: 3600 });
        } catch (err: unknown) {
            const message = (err as { message?: string })?.message ?? "unknown error";
            throw new Error(`Failed to generate presigned URL for ${key}: ${message}`);
        }
    }
}
