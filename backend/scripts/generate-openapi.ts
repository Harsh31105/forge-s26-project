/**
 * generate-openapi.ts
 *
 * Reads backend/api/openapi.yaml and writes it out as formatted JSON to
 * backend/api/openapi.json.
 *
 * Usage (from the backend/ directory):
 *   npx ts-node scripts/generate-openapi.ts
 *
 * Or with ts-node installed globally:
 *   ts-node scripts/generate-openapi.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yamljs';

// Resolve paths relative to the backend/ directory so the script works
// regardless of the cwd it is invoked from.
const backendDir = path.resolve(__dirname, '..');
const inputPath = path.join(backendDir, 'api', 'openapi.yaml');
const outputPath = path.join(backendDir, 'api', 'openapi.json');

function main(): void {
  if (!fs.existsSync(inputPath)) {
    console.error(`[generate-openapi] Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`[generate-openapi] Reading  ${inputPath}`);
  // yamljs.load parses YAML into a plain JavaScript object
  const spec: unknown = yaml.load(inputPath);

  const json = JSON.stringify(spec, null, 2);

  // Ensure the output directory exists (it always should, but be safe)
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, json, 'utf-8');
  console.log(`[generate-openapi] Written  ${outputPath}`);
}

main();
