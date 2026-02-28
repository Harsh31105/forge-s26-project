/**
 * Run this after provisioning the bucket to verify S3 upload + get works.
 * From backend/: npx ts-node scripts/verify-s3.ts
 */
import "dotenv/config";
import { s3Config } from "../src/config/s3";
import { TraceDocumentRepositoryS3 } from "../src/storage/s3/traceDocuments";
import { Readable } from "stream";

const required = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "S3_BUCKET_NAME"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
    console.error("Missing env:", missing.join(", "));
    process.exit(1);
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
}

async function main() {
    const repo = new TraceDocumentRepositoryS3(s3Config);
    const testKey = {
        departmentId: 1,
        courseCode: 1200,
        semester: "fall",
        lectureYear: 2025,
        professorId: "verify-test",
    };

    const testContent = Buffer.from("%PDF-1.4 fake pdf for verification\n");
    console.log("Uploading test PDF...");
    const s3Key = await repo.uploadPdf(testKey, testContent);
    console.log("Uploaded to:", s3Key);

    console.log("Retrieving...");
    const stream = await repo.getPdf(testKey);
    const retrieved = await streamToBuffer(stream);
    if (!retrieved.equals(testContent)) {
        console.error("Mismatch: uploaded and retrieved content differ.");
        process.exit(1);
    }
    console.log("Verified: upload and get work correctly.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
