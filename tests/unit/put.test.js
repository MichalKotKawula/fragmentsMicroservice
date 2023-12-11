const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const hash = require('../../src/hash');

const fragment1 = new Fragment({ ownerId: hash('user1@email.com'), type: 'text/plain', size: 0 });

describe('PUT /v1/fragments/:id', () => {
  test("a fragment's data can be modified", async () => {
    await fragment1.save();
    // eslint-disable-next-line no-undef
    await fragment1.setData(Buffer.from('This is a fragment'));

    const res = await request(app)
      .put(`/v1/fragments/${fragment1.id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', fragment1.type)
      // eslint-disable-next-line no-undef
      .send(Buffer.from('This fragment has been modified'));

    expect(res.statusCode).toBe(200);
    expect(res.text).toEqual(expect.stringContaining('formats'));
    const data = await fragment1.getData();
    expect(data.toString()).toBe('This fragment has been modified');
  });

  test("a fragment's type cannot be modified", async () => {
    const fragment = new Fragment({ ownerId: hash('user1@email.com'), type: 'text/markdown' });
    await fragment.save();
    // eslint-disable-next-line no-undef
    await fragment.setData(Buffer.from('## This is a fragment'));

    // supported extension
    let res = await request(app)
      .put(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      // eslint-disable-next-line no-undef
      .send(Buffer.from('## This fragment has been modified'));

    let data = await fragment.getData();
    expect(res.statusCode).toBe(400);
    expect(data.toString()).toBe('## This is a fragment');

    // unsupported extension
    res = await request(app)
      .put(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/bmp')
      // eslint-disable-next-line no-undef
      .send(Buffer.from('## This fragment has been modified'));

    data = await fragment.getData();
    expect(res.statusCode).toBe(415);
    expect(data.toString()).toBe('## This is a fragment');
  });

  test('Empty fragment content generates 400 error', async () => {
    await fragment1.save();
    // eslint-disable-next-line no-undef
    await fragment1.setData(Buffer.from('Test fragment'));

    const res = await request(app)
      .put(`/v1/fragments/${fragment1.id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', fragment1.type)
      // eslint-disable-next-line no-undef
      .send(Buffer.from(''));

    const data = await fragment1.getData();
    expect(res.statusCode).toBe(400);
    expect(data.toString()).toBe('Test fragment');
  });

  test('unknown id generates 404 error', async () => {
    await fragment1.save();
    // eslint-disable-next-line no-undef
    await fragment1.setData(Buffer.from('Hello'));

    const res = await request(app)
      .put(`/v1/fragments/123`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', fragment1.type)
      // eslint-disable-next-line no-undef
      .send(Buffer.from('This fragment has been modified'));

    expect(res.statusCode).toBe(404);
  });
});
