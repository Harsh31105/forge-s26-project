import request from 'supertest';
import { initApp } from '../server';

const application = initApp(true);
const app = application.server;

test('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
});