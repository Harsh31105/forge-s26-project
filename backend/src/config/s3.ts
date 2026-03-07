import process from "process";

export interface S3 {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucketName: string;
}

export const s3Config: S3 = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION!,
    bucketName: process.env.S3_BUCKET_NAME!,
};
