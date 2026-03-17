import { validateConfig } from '../src/config/config.js';

try {
    validateConfig();
    console.log('Environment configuration is valid.');
} catch (err) {
    console.error('Invalid environment configuration:');
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
}
