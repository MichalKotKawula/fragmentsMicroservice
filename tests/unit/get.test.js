// // tests/unit/get.test.js

const request = require('supertest');
const app = require('../../src/app');
const logger = require('../../src/logger');
const { Fragment } = require('../../src/model/fragment');
const { createErrorResponse, createSuccessResponse } = require('../../src/response');
const hash = require('../../src/hash');

const fragment1 = new Fragment({ ownerId: hash('user1@email.com'), type: 'text/plain', size: 0 });
const fragment2 = new Fragment({ ownerId: hash('user1@email.com'), type: 'text/plain', size: 0 });

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair is used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('retrieve a list of fragment IDs', async () => {
    await fragment1.save();
    await fragment2.save();
    const fragment3 = new Fragment({
      ownerId: hash('user1@email.com'),
      type: 'text/plain; charset=utf-8',
      size: 0,
    });
    await fragment3.save();
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    logger.debug(`got back: ${res.body.fragments}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments.length).not.toBe(0);
    expect(typeof res.body.fragments[0]).not.toBe('object');
  });
});

describe('GET /v1/fragments?expand=1', () => {
  test('list of fragments contains their metadata', async () => {
    await fragment1.save();
    // eslint-disable-next-line no-undef
    await fragment1.setData(Buffer.from('fjslkfjalsdjflkajsdl'));
    await fragment2.save();
    // eslint-disable-next-line no-undef
    await fragment2.setData(Buffer.from('fjslkfjalsdjflkajsdlfdsfdsdsafdsafsdfdsafdsaads'));
    const fragment3 = new Fragment({
      ownerId: hash('user1@email.com'),
      type: 'text/plain; charset=utf-8',
      size: 0,
    });
    // eslint-disable-next-line no-undef
    await fragment3.setData(Buffer.from('hello'));

    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');

    logger.debug(`got back: ${JSON.stringify(res.body.fragments, null, 4)}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments.length).toBe(4);

    // each fragment object in the array must contain metadata (represented by 6 keys)
    res.body.fragments.forEach((fragment) => {
      expect(Object.keys(fragment).length).toBe(6);
    });
  });

  test('URL endpoint must be valid', async () => {
    const res = await request(app)
      .get('/v1/fragments??expand=1')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual(createErrorResponse(404, 'Invalid URL'));
  });
});

describe('GET /v1/fragments/:id, GET /v1/fragments/:id.ext', () => {
  test("a fragment's data can be retrieved using its ID", async () => {
    const fragment = new Fragment({
      ownerId: hash('user2@email.com'),
      type: 'text/plain',
      size: 0,
    });
    await fragment.save();
    // eslint-disable-next-line no-undef
    await fragment.setData(Buffer.from('This is a fragment'));

    logger.debug(`ID used in URL: ${fragment.id}`);
    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}`)
      .auth('user2@email.com', 'password2');

    const data = await fragment.getData();
    logger.debug(`got back: ${JSON.stringify(res, null, 4)}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.string).toBe(data.string);
  });

  test('invalid fragment id results in 404 error', async () => {
    const fragment = new Fragment({
      ownerId: hash('user1@email.com'),
      type: 'text/plain',
      size: 0,
    });
    await fragment.save();

    let errorResponse;
    try {
      await Fragment.byId(fragment.ownerId, 'invalid-id');
    } catch (err) {
      errorResponse = createErrorResponse(404, err.message);
    }

    const res = await request(app).get(`/v1/fragments/quux`).auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body).toStrictEqual(errorResponse);
  });

  test(".txt extension returns the fragment's data unchanged", async () => {
    const fragment = new Fragment({
      ownerId: hash('user2@email.com'),
      type: 'text/plain',
      size: 0,
    });
    await fragment.save();
    // eslint-disable-next-line no-undef
    await fragment.setData(Buffer.from('TEST FRAGMENT'));

    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}.txt`)
      .auth('user2@email.com', 'password2');

    logger.debug(`got back: ${JSON.stringify(res, null, 4)}`);
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('TEST FRAGMENT');
  });

  test('unsupported extension results in 415 error', async () => {
    await fragment1.save();
    // eslint-disable-next-line no-undef
    await fragment1.setData(Buffer.from('TEST FRAGMENT'));

    const res = await request(app)
      .get(`/v1/fragments/${fragment1.id}.mp4`)
      .auth('user1@email.com', 'password1');

    const errorResponse = createErrorResponse(415, `Unable to convert to .mp4`);
    logger.debug(`got back: ${JSON.stringify(res.body, null, 4)}`);
    expect(res.statusCode).toBe(415);
    expect(res.body).toStrictEqual(errorResponse);
  });

  test('unknown extension results in 415 error', async () => {
    await fragment2.save();
    // eslint-disable-next-line no-undef
    await fragment2.setData(Buffer.from('Test fragment'));
    const res = await request(app)
      .get(`/v1/fragments/${fragment1.id}.abc`)
      .auth('user2@email.com', 'password2');
    const errorResponse = createErrorResponse(415, `The extension .abc is invalid`);
    logger.debug(`got back: ${JSON.stringify(res.body, null, 4)}`);
    expect(res.statusCode).toBe(415);
    expect(res.body).toStrictEqual(errorResponse);
  });

  test('converting text/markdown to text/html', async () => {
    const fragment = new Fragment({
      ownerId: hash('user1@email.com'),
      type: 'text/markdown',
      size: 0,
    });
    await fragment.save();
    // eslint-disable-next-line no-undef
    await fragment.setData(Buffer.from('## Test fragment'));

    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}.html`)
      .auth('user1@email.com', 'password1');

    const data = await fragment.convertData('text/html');
    logger.debug(`got back: ${JSON.stringify(res, null, 4)}`);
    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toBe('text/html; charset=utf-8');
    expect(res.text).toBe(data);
  });

  test('converting text/markdown to text/plain', async () => {
    const fragment = new Fragment({
      ownerId: hash('user1@email.com'),
      type: 'text/markdown',
      size: 0,
    });
    await fragment.save();
    // eslint-disable-next-line no-undef
    await fragment.setData(Buffer.from('# Test fragment'));

    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    const data = await fragment.convertData('text/plain');
    logger.debug(`got back: ${JSON.stringify(res, null, 4)}`);
    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toBe('text/plain');
    expect(res.text).toBe(data.toString());
  });
});

describe('GET /fragments/:id/info', () => {
  test("retrieve a fragment's metadata", async () => {
    await fragment1.save();
    await fragment1.setData(
      // eslint-disable-next-line no-undef
      Buffer.from(
        'Allows the authenticated user to get (i.e., read) the metadata for one of their existing fragments with the specified id. If no such fragment exists, returns an HTTP 404 with an appropriate error message.'
      )
    );

    const res = await request(app)
      .get(`/v1/fragments/${fragment1.id}/info`)
      .auth('user1@email.com', 'password1');

    const successResponse = createSuccessResponse({ fragment: fragment1 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(successResponse);
  });

  test('including an extension in ID generates error', async () => {
    await fragment1.save();
    await fragment1.setData(
      // eslint-disable-next-line no-undef
      Buffer.from(
        'Allows the authenticated user to get (i.e., read) the metadata for one of their existing fragments with the specified id. If no such fragment exists, returns an HTTP 404 with an appropriate error message.'
      )
    );

    const res = await request(app)
      .get(`/v1/fragments/${fragment1.id}.txt/info`)
      .auth('user1@email.com', 'password1');

    const errorResponse = createErrorResponse(
      404,
      `Error: fragment does not exist for this user. Got ID ${fragment1.id}.txt`
    );
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual(errorResponse);
  });

  test('invalid ID generates error', async () => {
    await fragment1.save();
    // eslint-disable-next-line no-undef
    await fragment1.setData(Buffer.from('Test fragment'));

    const res = await request(app)
      .get(`/v1/fragments/${fragment1.id}./info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
  });
});
