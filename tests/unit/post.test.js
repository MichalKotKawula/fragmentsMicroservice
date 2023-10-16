const request = require('supertest');
const app = require('../../src/app');
const { createErrorResponse } = require('../../src/response');

describe('POST /v1/fragments', () => {
  //  If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // An authenticated user is able to create a plain text fragment
  test('authenticated user can create a fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');

    expect(res.statusCode).toBe(201);
  });

  test('unauthenticated user cannot create a fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('invalid_user@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Unauthenticated fragment');

    expect(res.statusCode).toBe(401);
  });

  test('response includes a Location header with URL', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user2@email.com', 'password2')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');

    expect(res.statusCode).toBe(201);
    expect(res.headers.location).toMatch(
      /\/v1\/fragments\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/
    );
  });

  test('unsupported fragment type generates 415 error', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'video/ogg')
      // eslint-disable-next-line no-undef
      .send(Buffer.from('TEST FRAGMENT'));

    const errorResponse = createErrorResponse(415, 'UNSUPPORTED_CONTENT_TYPE');
    expect(res.statusCode).toBe(415);
    expect(res.body).toStrictEqual(errorResponse);
  });

  test('a fragment cannot contain invalid data ', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      // eslint-disable-next-line no-undef
      .send(Buffer.from(' '));

    expect(res.statusCode).toBe(400);
  });

  test('success response contains fragment data', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');

    expect(res.statusCode).toBe(201);
  });

  test('creating a fragment object with no data generates 400 error', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('');

    const errorResponse = createErrorResponse(400, 'EMPTY_DATA');
    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual(errorResponse);
  });

  test('creating a fragment without specifying content-type generates 415 error', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', '\t')
      .send('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
    expect(res.statusCode).toBe(415);
  });
});
