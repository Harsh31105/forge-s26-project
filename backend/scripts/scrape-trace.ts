import fs from "fs";
import { PDFParse } from "pdf-parse";

import { writeFileSync } from "fs";

async function extractText(pdfPath: string): Promise<void> {
  const buffer = fs.readFileSync(pdfPath);
  const uint8 = new Uint8Array(buffer);
  const parser = new PDFParse(uint8);
  const result = await parser.getText();

  writeFileSync("output.txt", result.text);
}

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Usage: ts-node scripts/scrape-trace.ts <path-to-pdf>");
  process.exit(1);
}

extractText(pdfPath).catch((err) => {
  console.error(err);
  process.exit(1);
});
