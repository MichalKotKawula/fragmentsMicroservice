// tests/unit/app.test.js

const request = require('supertest');

// Get our Express app object (we don't need the server part)
const app = require('../../src/app');

describe('get App 404', () => {
  test('404 Handle', async () => {
    const res = await request(app).get('/non-existing');
    expect(res.statusCode).toBe(404);
  });
});
